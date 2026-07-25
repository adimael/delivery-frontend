import { useState, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";
import { useUserProfile } from "@/hooks/useUserProfile";
import { MapPinOff, QrCode } from "lucide-react";
import { generatePixPayload, generatePixQRCode } from "@/utils/pixUtils";
import { useCartStore } from "@/stores/cartStore";
import { InvoiceModal } from "@/components/checkout/InvoiceModal";
import { apiRequest } from '@/lib/api';
import { buscarEnderecoPorCep, formatarCep } from '@/lib/cep';

interface CartItem {
  id: string;
  name?: string;
  price: number;
  quantity: number;
  totalPrice?: number;
  customizations?: Record<string, unknown> | null;
}

interface OrderData {
  nomeDestinatario: string;
  telefone: string;
  endereco: string;
  numero: string;
  complemento: string;
  pontoReferencia: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
  observacoes: string;
  formaPagamento: string;
}

interface InvoiceItem {
  name: string;
  price: number;
  quantity: number;
  totalPrice: number;
  customizations?: Record<string, unknown> | null;
}

interface InvoiceData {
  id: string;
  numeroOrdem: string;
  nomeDestinatario?: string | null;
  telefone?: string;
  endereco: string;
  observacoes?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxaEntrega: number;
  desconto?: number;
  total: number;
  dataHora: string;
  formaPagamento: string;
  whatsappUrl?: string;
}

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  onFinishOrder: (orderData: Record<string, unknown>) => void;
}

export const CheckoutModal = ({ open, onClose, onFinishOrder }: CheckoutModalProps) => {
  const GUEST_ADDRESS_KEY = 'deliveryGuestAddress';
  const { user } = useAuth();
  const { items, clearCart } = useCartStore();
  const { toast } = useToast();
  const { configuracao, estaAberto } = useEstabelecimento();
  const { enderecos, addEndereco } = useUserProfile();
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'delivery-type' | 'address' | 'payment' | 'pix'>('delivery-type');
  const [tipoEntrega, setTipoEntrega] = useState<'entrega' | 'retirada'>('entrega');
  const [numeroOrdem, setNumeroOrdem] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [pixCopiaECola, setPixCopiaECola] = useState('');
  const [useSavedAddress, setUseSavedAddress] = useState(true);
  const [selectedEnderecoId, setSelectedEnderecoId] = useState('');
  const [salvarNovoEndereco, setSalvarNovoEndereco] = useState(true);
  const [cupomCodigo, setCupomCodigo] = useState('');
  const [cupomAplicado, setCupomAplicado] = useState<{
    codigo: string;
    desconto: number;
    descricao?: string;
  } | null>(null);
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [pedidoCriado, setPedidoCriado] = useState<any>(null);
  const [areaIndisponivel, setAreaIndisponivel] = useState('');
  const [precisaTroco, setPrecisaTroco] = useState(false);
  const [trocoParaCentavos, setTrocoParaCentavos] = useState(0);
  
  // Use the platform name from configuration or default to "Plataforma"
  const platformName = configuracao?.nome_plataforma || "Plataforma";
  
  // Use establishment address from configuration or defaults
  const enderecoEstabelecimento = configuracao?.endereco_estabelecimento || "Av. Nélson Leite Leal, Nº 106";
  const cidadeEstabelecimento = configuracao?.cidade_estabelecimento || "Gandu";
  const estadoEstabelecimento = configuracao?.estado_estabelecimento || "BA";
  const cepEstabelecimento = configuracao?.cep_estabelecimento || "45450-000";

  const [orderData, setOrderData] = useState<OrderData>({
    nomeDestinatario: '',
    telefone: '',
    endereco: '',
    numero: '',
    complemento: '',
    pontoReferencia: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: '',
    observacoes: '',
    formaPagamento: 'pix'
  });

  const preencherEnderecoPeloCep = async (valor: string) => {
    const cep = formatarCep(valor);
    setOrderData(prev => ({ ...prev, cep }));
    if (cep.replace(/\D/g, '').length !== 8) return;

    try {
      const dados = await buscarEnderecoPorCep(cep);
      if (!dados) {
        toast({
          title: "CEP não encontrado",
          description: "Confira o CEP ou preencha o endereço manualmente.",
          variant: "destructive",
        });
        return;
      }
      setOrderData(prev => ({
        ...prev,
        cep: dados.cep,
        endereco: dados.logradouro || prev.endereco,
        bairro: dados.bairro || prev.bairro,
        cidade: dados.cidade || prev.cidade,
        estado: dados.estado || prev.estado,
        complemento: prev.complemento || dados.complemento,
      }));
    } catch {
      toast({
        title: "Consulta de CEP indisponível",
        description: "Você ainda pode preencher o endereço manualmente.",
        variant: "destructive",
      });
    }
  };

  const formatarValorEmReais = (centavos: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(centavos / 100);

  const alterarValorTroco = (valor: string) => {
    const centavos = Number(valor.replace(/\D/g, '')) || 0;
    setTrocoParaCentavos(centavos);
  };

  // Função para converter qualquer valor para número
  const toNumber = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const normalizarLocalidade = (value: string) =>
    value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

  const enderecoSelecionado = enderecos.find(
    (endereco) => endereco.id === selectedEnderecoId,
  ) || enderecos.find((endereco) => endereco.principal) || enderecos[0];
  const usandoEnderecoSalvo = Boolean(
    user && useSavedAddress && enderecoSelecionado,
  );
  const enderecoVisitanteSalvo = Boolean(
    !user && orderData.endereco && orderData.numero && orderData.bairro,
  );
  const bairroSelecionado = usandoEnderecoSalvo
    ? enderecoSelecionado?.bairro || ''
    : orderData.bairro;
  const cidadeSelecionada = usandoEnderecoSalvo
    ? enderecoSelecionado?.cidade || ''
    : orderData.cidade;
  const estadoSelecionado = usandoEnderecoSalvo
    ? enderecoSelecionado?.estado || ''
    : orderData.estado;
  const entregaRestrita = configuracao?.entrega_restrita === true
    || configuracao?.entrega_restrita === 1
    || configuracao?.entrega_restrita === '1'
    || configuracao?.entrega_restrita === 'true';

  const mensagemAreaIndisponivel = (): string | null => {
    if (tipoEntrega !== 'entrega' || !entregaRestrita) return null;

    const cidade = normalizarLocalidade(cidadeSelecionada);
    const estado = estadoSelecionado.trim().toUpperCase();
    const bairro = normalizarLocalidade(bairroSelecionado);
    const areas = configuracao?.areas_entrega || [];
    const atendida = areas.some((area) => {
      if (
        normalizarLocalidade(area.cidade || '') !== cidade
        || (area.estado || '').trim().toUpperCase() !== estado
      ) {
        return false;
      }

      const localidades = area.localidades || [];
      return localidades.length === 0 || localidades.some(
        (localidade) => normalizarLocalidade(localidade) === bairro,
      );
    });

    if (atendida) return null;

    const cobertura = areas.map((area) => {
      const localidades = area.localidades || [];
      return localidades.length > 0
        ? `${area.cidade}/${area.estado}: ${localidades.join(', ')}`
        : `${area.cidade}/${area.estado}`;
    }).join(' • ');

    return cobertura
      ? `Ainda não entregamos nesse endereço. Nossa área de entrega atende: ${cobertura}.`
      : 'A área de entrega ainda não foi configurada. Escolha retirada no local ou fale com o estabelecimento.';
  };
  const localidadeGratis = (configuracao?.localidades_frete_gratis || [])
    .some(localidade => normalizarLocalidade(localidade) === normalizarLocalidade(bairroSelecionado));
  const subtotal = items.reduce((acc, item) => {
    const itemTotal = item.totalPrice !== undefined && item.totalPrice !== null
      ? item.totalPrice
      : item.price * item.quantity;
    return acc + itemTotal;
  }, 0);
  const minimoFreteGratis = toNumber(configuracao?.valor_minimo_frete_gratis || 0);
  const gratuidadePorValor = minimoFreteGratis > 0 && subtotal >= minimoFreteGratis;

  const calculatedValues = {
    subtotal,
    taxaEntrega: tipoEntrega === 'entrega' && !localidadeGratis && !gratuidadePorValor
      ? toNumber(configuracao?.taxa_entrega || 0)
      : 0,
    totalAjustado: 0 // Will be calculated below
  };

  calculatedValues.totalAjustado = calculatedValues.subtotal + calculatedValues.taxaEntrega;
  if (cupomAplicado) {
    calculatedValues.totalAjustado = Math.max(
      0,
      calculatedValues.totalAjustado - cupomAplicado.desconto,
    );
  }

  const urlPedidoWhatsApp = (pedido: any): string | null => {
    const numeroConfigurado = String(configuracao?.whatsapp || '').replace(/\D/g, '');
    if (numeroConfigurado.length < 10) return null;
    const numero = numeroConfigurado.length <= 11
      ? `55${numeroConfigurado}`
      : numeroConfigurado;
    const moeda = (valor: unknown) => new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(Number(valor || 0));
    const linhasItens = items.flatMap((item, indice) => {
      const personalizacoes = item.customizations as any;
      const variacoes = personalizacoes?.variations
        ? Object.values(personalizacoes.variations).map((variacao: any) =>
            `   • ${variacao.nome || variacao.name || 'Variação selecionada'}`,
          )
        : [];
      const selecoes = Array.isArray(personalizacoes?.selections)
        ? personalizacoes.selections.map((opcao: any) =>
            `   + ${Number(opcao.quantidade || 1)}x ${opcao.nome || opcao.name || 'Adicional'}`,
          )
        : [];
      return [
        `${indice + 1}. ${item.quantity}x ${item.name || 'Produto'} — ${moeda(item.totalPrice ?? item.price * item.quantity)}`,
        ...variacoes,
        ...selecoes,
      ];
    });
    const mensagem = [
      `*NOVO PEDIDO #${pedido.numero_pedido || numeroOrdem}*`,
      '',
      `*Cliente:* ${pedido.nome_cliente || orderData.nomeDestinatario || 'Cliente'}`,
      `*Telefone:* ${orderData.telefone || pedido.telefone_cliente || 'Não informado'}`,
      `*Entrega:* ${tipoEntrega === 'retirada' ? 'Retirada no local' : 'Delivery'}`,
      `*Endereço:* ${pedido.endereco_entrega || 'Retirada no estabelecimento'}`,
      '',
      '*ITENS*',
      ...linhasItens,
      '',
      `Subtotal: ${moeda(pedido.subtotal ?? calculatedValues.subtotal)}`,
      `Taxa de entrega: ${moeda(pedido.taxa_entrega ?? calculatedValues.taxaEntrega)}`,
      `Desconto: ${moeda(pedido.desconto ?? cupomAplicado?.desconto ?? 0)}`,
      `*TOTAL: ${moeda(pedido.valor_total ?? calculatedValues.totalAjustado)}*`,
      `*Pagamento:* ${String(orderData.formaPagamento || '').toUpperCase()}`,
      orderData.observacoes ? `*Observações:* ${orderData.observacoes}` : '',
    ].filter(Boolean).join('\n');

    return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  };

  const reservarWhatsApp = (): Window | null => configuracao?.whatsapp
    ? window.open('about:blank', 'delivery-pedido-whatsapp')
    : null;

  const encaminharAoWhatsApp = (pedido: any, janela: Window | null) => {
    const url = urlPedidoWhatsApp(pedido);
    if (!url) {
      janela?.close();
      return;
    }
    if (janela) janela.location.href = url;
    else window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Efeito para preencher automaticamente com o endereço principal do cliente
  useEffect(() => {
    if (usandoEnderecoSalvo && enderecoSelecionado) {
      if (!selectedEnderecoId) setSelectedEnderecoId(enderecoSelecionado.id);
        setOrderData(prev => ({
          ...prev,
          nomeDestinatario: user.nome_completo || '',
          telefone: user.telefone || '',
          endereco: enderecoSelecionado.endereco_completo || '',
          numero: enderecoSelecionado.numero || '',
          complemento: enderecoSelecionado.complemento || '',
          pontoReferencia: enderecoSelecionado.ponto_referencia || '',
          bairro: enderecoSelecionado.bairro || '',
          cidade: enderecoSelecionado.cidade || '',
          estado: enderecoSelecionado.estado || '',
          cep: enderecoSelecionado.cep || ''
        }));
    }
  }, [user, enderecos, useSavedAddress, selectedEnderecoId]);

  useEffect(() => {
    if (user || !open || tipoEntrega !== 'entrega') return;

    const possuiDados = [
      orderData.nomeDestinatario,
      orderData.telefone,
      orderData.endereco,
      orderData.numero,
      orderData.complemento,
      orderData.pontoReferencia,
      orderData.bairro,
      orderData.cidade,
      orderData.estado,
      orderData.cep,
    ].some((valor) => valor.trim() !== '');

    if (possuiDados) {
      localStorage.setItem(GUEST_ADDRESS_KEY, JSON.stringify({
        nomeDestinatario: orderData.nomeDestinatario,
        telefone: orderData.telefone,
        endereco: orderData.endereco,
        numero: orderData.numero,
        complemento: orderData.complemento,
        pontoReferencia: orderData.pontoReferencia,
        bairro: orderData.bairro,
        cidade: orderData.cidade,
        estado: orderData.estado,
        cep: orderData.cep,
      }));
    }
  }, [user, open, tipoEntrega, orderData]);

  // Efeito para atualizar o telefone quando o usuário mudar
  useEffect(() => {
    if (user) {
      setOrderData(prev => ({
        ...prev,
        nomeDestinatario: user.nome_completo || '',
        telefone: user.telefone || ''
      }));
    }
  }, [user]);

  // Reset form when modal opens
  const resetForm = useCallback(() => {
    let enderecoVisitante: Partial<OrderData> = {};
    if (!user) {
      try {
        enderecoVisitante = JSON.parse(
          localStorage.getItem(GUEST_ADDRESS_KEY) || '{}',
        ) as Partial<OrderData>;
      } catch {
        enderecoVisitante = {};
      }
    }
    setStep('delivery-type');
    setTipoEntrega('entrega');
    setNumeroOrdem('');
    setUseSavedAddress(true);
    setSelectedEnderecoId('');
    setSalvarNovoEndereco(true);
    setCupomCodigo('');
    setCupomAplicado(null);
    setPedidoCriado(null);
    setAreaIndisponivel('');
    setPrecisaTroco(false);
    setTrocoParaCentavos(0);
    setOrderData({
      nomeDestinatario: user?.nome_completo || '',
      telefone: user?.telefone || '',
      endereco: '',
      numero: '',
      complemento: '',
      pontoReferencia: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
      observacoes: '',
      formaPagamento: 'pix',
      ...enderecoVisitante,
    });
    setQrCodeUrl('');
    setPixCopiaECola('');
  }, [user]);

  const excluirEnderecoVisitante = () => {
    localStorage.removeItem(GUEST_ADDRESS_KEY);
    setOrderData((atual) => ({
      ...atual,
      nomeDestinatario: '',
      telefone: '',
      endereco: '',
      numero: '',
      complemento: '',
      pontoReferencia: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
    }));
    toast({
      title: 'Endereço removido',
      description: 'Você pode informar um novo endereço de entrega.',
    });
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, resetForm]);


  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInvoiceClose = () => {
    setShowInvoice(false);
    setInvoiceData(null);
    resetForm();
    
    // Limpar carrinho apenas quando a nota fiscal for fechada
    clearCart();
    
    toast({
      title: "Pedido finalizado!",
      description: "Obrigado pela preferência! Seu pedido está sendo preparado.",
    });
  };

  useEffect(() => {
    const prepararPix = async () => {
     if (step === 'pix' && configuracao?.chave_pix && pedidoCriado) {
      try {
        const newNumeroOrdem = String(pedidoCriado.numero_pedido);
        setNumeroOrdem(newNumeroOrdem);
        
        // Prepare PIX data
        const pixData = {
          chavePix: configuracao.chave_pix,
          nomeRecebedor: configuracao.nome_recebedor_pix || '',
          cidadeRecebedor: configuracao.cidade_recebedor_pix || '',
          cepRecebedor: configuracao.cep_recebedor_pix || '',
          valor: Number(pedidoCriado.valor_total),
          txid: newNumeroOrdem
        };
        
        // Generate the PIX payload string
        const pixPayload = generatePixPayload(pixData);
        setPixCopiaECola(pixPayload);
        
        // Generate QR code with the proper PIX payload
        const qrCodeUrl = await generatePixQRCode(pixPayload);
        setQrCodeUrl(qrCodeUrl);
      } catch (error) {
        console.error('Error generating PIX QR code:', error);
        setQrCodeUrl('');
      }
     }
    };
    void prepararPix();
  }, [step, configuracao, pedidoCriado]);

  const handleNext = async () => {
    if (!estaAberto && !pedidoCriado) {
      toast({
        title: "Estabelecimento fechado",
        description: "O estabelecimento fechou e não está aceitando novos pedidos.",
        variant: "destructive",
      });
      return;
    }

    if (step === 'delivery-type') {
      setStep('address');
    } else if (step === 'address') {
      // Only validate address fields if we're not using a saved address
      if (
        tipoEntrega === 'entrega'
        && !usandoEnderecoSalvo
        && (
          !orderData.nomeDestinatario
          || !orderData.telefone
          || !orderData.endereco
          || !orderData.numero
          || !orderData.bairro
          || !orderData.cidade
          || !orderData.estado
          || !orderData.cep
        )
      ) {
        toast({
          title: "Dados incompletos",
          description: "Por favor, preencha todos os campos obrigatórios do endereço.",
          variant: "destructive",
        });
        return;
      }
      if (
        tipoEntrega === 'entrega'
        && user
        && !usandoEnderecoSalvo
        && salvarNovoEndereco
      ) {
        const salvo = await addEndereco({
          nome_endereco: 'Endereço de entrega',
          endereco_completo: orderData.endereco,
          numero: orderData.numero,
          complemento: orderData.complemento,
          ponto_referencia: orderData.pontoReferencia,
          bairro: orderData.bairro,
          cidade: orderData.cidade,
          estado: orderData.estado,
          cep: orderData.cep,
          principal: enderecos.length === 0,
        });
        if (!salvo) {
          toast({
            title: 'Endereço não salvo',
            description: 'Confira os dados do endereço antes de continuar.',
            variant: 'destructive',
          });
          return;
        }
      }
      setStep('payment');
    } else if (step === 'payment') {
      if (orderData.formaPagamento === 'dinheiro' && precisaTroco) {
        const trocoPara = trocoParaCentavos / 100;
        if (trocoPara <= calculatedValues.totalAjustado) {
          toast({
            title: 'Informe o valor para o troco',
            description: 'O valor pago deve ser maior que o total do pedido.',
            variant: 'destructive',
          });
          return;
        }
      }
      if (orderData.formaPagamento === 'pix') {
        if (!configuracao?.chave_pix?.trim()) {
          toast({
            title: 'PIX indisponível',
            description: 'O estabelecimento ainda não configurou uma chave PIX.',
            variant: 'destructive',
          });
          return;
        }
        if (isSubmitting) return;
        const janelaWhatsApp = reservarWhatsApp();
        setIsSubmitting(true);
        try {
          const criado = await saveOrderToMySQL();
          encaminharAoWhatsApp(criado, janelaWhatsApp);
          setPedidoCriado(criado);
          setStep('pix');
        } catch (error) {
          janelaWhatsApp?.close();
          toast({
            title: 'Não foi possível criar o pedido',
            description: error instanceof Error ? error.message : 'Tente novamente.',
            variant: 'destructive',
          });
        } finally {
          setIsSubmitting(false);
        }
      } else {
        handleFinishOrder();
      }
    }
  };

  const aplicarCupom = async () => {
    const codigo = cupomCodigo.trim().toUpperCase();
    if (!codigo || validandoCupom) return;
    setValidandoCupom(true);
    try {
      const resultado = await apiRequest(user ? '/cupons/validar-autenticado' : '/cupons/validar', {
        method: 'POST',
        body: JSON.stringify({
          codigo,
          subtotal,
          itens: items.map((item) => ({
            produto_id: item.id,
            total: item.totalPrice ?? item.price * item.quantity,
          })),
        }),
      });
      if (resultado.exige_cadastro && !user) {
        throw new Error('Este cupom é exclusivo para clientes cadastrados. Entre na sua conta.');
      }
      setCupomAplicado({
        codigo: String(resultado.codigo),
        desconto: Number(resultado.desconto),
        descricao: resultado.descricao,
      });
      setCupomCodigo(String(resultado.codigo));
      toast({
        title: 'Cupom aplicado',
        description: `Desconto de ${new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(Number(resultado.desconto))}.`,
      });
    } catch (error) {
      setCupomAplicado(null);
      toast({
        title: 'Cupom não aplicado',
        description: error instanceof Error ? error.message : 'Cupom inválido.',
        variant: 'destructive',
      });
    } finally {
      setValidandoCupom(false);
    }
  };

  const handleBack = () => {
    if (step === 'address') {
      setStep('delivery-type');
    } else if (step === 'payment') {
      setStep('address');
    } else if (step === 'pix') {
      setStep('payment');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const saveOrderToMySQL = async () => {
    try {
      if (!estaAberto) {
        throw new Error(
          "O estabelecimento fechou e não está aceitando novos pedidos.",
        );
      }

      const mensagemCobertura = mensagemAreaIndisponivel();
      if (mensagemCobertura) {
        setAreaIndisponivel(mensagemCobertura);
        throw new Error(mensagemCobertura);
      }
      
      // Ensure we have the correct address data
      let enderecoCompleto = '';
      if (tipoEntrega === 'retirada') {
        enderecoCompleto = `Retirada no Local - ${platformName}, ${enderecoEstabelecimento}, ${cidadeEstabelecimento}-${estadoEstabelecimento}${!enderecoEstabelecimento.toLowerCase().includes('cep') ? ', CEP: ' + cepEstabelecimento : ''}`;
      } else {
        // For delivery, check if we're using a saved address
        if (usandoEnderecoSalvo && enderecoSelecionado) {
          const enderecoPrincipal = enderecoSelecionado;
          if (enderecoPrincipal) {
            enderecoCompleto = `${enderecoPrincipal.endereco_completo}${enderecoPrincipal.numero && !enderecoPrincipal.endereco_completo.trim().endsWith(',') ? ', ' + enderecoPrincipal.numero : ' ' + (enderecoPrincipal.numero || '')}${enderecoPrincipal.complemento ? ', ' + enderecoPrincipal.complemento : ''}, ${enderecoPrincipal.bairro}, ${enderecoPrincipal.cidade}${!enderecoPrincipal.endereco_completo.toLowerCase().includes('cep') ? ', CEP: ' + enderecoPrincipal.cep : ''}${enderecoPrincipal.ponto_referencia ? ', Referência: ' + enderecoPrincipal.ponto_referencia : ''}`;
          } else {
            enderecoCompleto = `${orderData.endereco}${orderData.numero && !orderData.endereco.trim().endsWith(',') ? ', ' + orderData.numero : ' ' + (orderData.numero || '')}${orderData.complemento ? ', ' + orderData.complemento : ''}, ${orderData.bairro}, ${orderData.cidade}${!orderData.endereco.toLowerCase().includes('cep') ? ', CEP: ' + orderData.cep : ''}${orderData.pontoReferencia ? ', Referência: ' + orderData.pontoReferencia : ''}`;
          }
        } else {
          enderecoCompleto = `${orderData.endereco}${orderData.numero && !orderData.endereco.trim().endsWith(',') ? ', ' + orderData.numero : ' ' + (orderData.numero || '')}${orderData.complemento ? ', ' + orderData.complemento : ''}, ${orderData.bairro}, ${orderData.cidade}${!orderData.endereco.toLowerCase().includes('cep') ? ', CEP: ' + orderData.cep : ''}${orderData.pontoReferencia ? ', Referência: ' + orderData.pontoReferencia : ''}`;
        }
      }
      
      const tipoCliente = user ? 'logado' : 'convidado';
      
      let nomeCliente: string | null = null;
      if (user) {
        nomeCliente = user?.nome_completo || null;
      } else {
        nomeCliente = orderData.nomeDestinatario || 'Cliente Convidado';
      }
      
      const observacoesPedido = [
        orderData.observacoes.trim(),
        orderData.formaPagamento === 'dinheiro'
          ? precisaTroco
            ? `Troco para ${formatarValorEmReais(trocoParaCentavos)}`
            : 'Pagamento em dinheiro: não precisa de troco'
          : '',
      ].filter(Boolean).join(' | ');

      // Create order object
      const order = {
        numero_pedido: numeroOrdem,
        cliente_id: user?.id || null,
        nome_cliente: nomeCliente,
        telefone_cliente: orderData.telefone,
        tipo_cliente: tipoCliente,
        tipo_entrega: tipoEntrega,
        bairro_entrega: tipoEntrega === 'entrega' ? bairroSelecionado : null,
        cidade_entrega: tipoEntrega === 'entrega' ? cidadeSelecionada : null,
        estado_entrega: tipoEntrega === 'entrega' ? estadoSelecionado : null,
        cupom_codigo: cupomAplicado?.codigo || null,
        forma_pagamento: orderData.formaPagamento,
        valor_total: calculatedValues.totalAjustado,
        taxa_entrega: calculatedValues.taxaEntrega,
        endereco_entrega: enderecoCompleto,
        observacoes: observacoesPedido,
        status: 'pendente',
        itens_pedido: items.map(item => ({
          produto_id: item.id,
          quantidade: item.quantity,
          opcoes: item.customizations?.selections?.map(option => ({
            opcao_uuid: option.opcao_uuid,
            quantidade: option.quantidade
          })) || [],
          variacao_uuid: item.customizations?.variations
            ? Object.values(item.customizations.variations)[0]?.id || null
            : null,
          preco_unitario: item.price,
          preco_total: item.totalPrice !== undefined && item.totalPrice !== null 
            ? item.totalPrice 
            : item.price * item.quantity,
          observacoes: typeof item.customizations?.notes === 'string'
            ? item.customizations.notes.slice(0, 180)
            : null
        }))
      };
      
      
      // Save order to backend
      const createdOrder = await apiRequest(user ? '/pedidos' : '/checkout', {
        method: 'POST',
        body: JSON.stringify(order),
      });

      
      return createdOrder;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('❌ Erro ao salvar pedido:', errMsg);
      throw error;
    }
  };

  const handleFinishOrder = async () => {
    if (isSubmitting) return;
    
    const janelaWhatsApp = pedidoCriado ? null : reservarWhatsApp();
    setIsSubmitting(true);
    
    try {
      // Save order to MySQL
      const createdOrder = pedidoCriado ?? await saveOrderToMySQL();
      if (!pedidoCriado) {
        encaminharAoWhatsApp(createdOrder, janelaWhatsApp);
      }
      
      // Prepare invoice data with correct address information
      let enderecoCompleto = '';
      if (tipoEntrega === 'retirada') {
        enderecoCompleto = `Retirada no Local - ${platformName}, ${enderecoEstabelecimento}, ${cidadeEstabelecimento}-${estadoEstabelecimento}${!enderecoEstabelecimento.toLowerCase().includes('cep') ? ', CEP: ' + cepEstabelecimento : ''}`;
      } else {
        // For delivery, check if we're using a saved address
        if (usandoEnderecoSalvo && enderecoSelecionado) {
          const enderecoPrincipal = enderecoSelecionado;
          if (enderecoPrincipal) {
            enderecoCompleto = `${enderecoPrincipal.endereco_completo}${enderecoPrincipal.numero && !enderecoPrincipal.endereco_completo.trim().endsWith(',') ? ', ' + enderecoPrincipal.numero : ' ' + (enderecoPrincipal.numero || '')}${enderecoPrincipal.complemento ? ', ' + enderecoPrincipal.complemento : ''}, ${enderecoPrincipal.bairro}, ${enderecoPrincipal.cidade}${!enderecoPrincipal.endereco_completo.toLowerCase().includes('cep') ? ', CEP: ' + enderecoPrincipal.cep : ''}${enderecoPrincipal.ponto_referencia ? ', Referência: ' + enderecoPrincipal.ponto_referencia : ''}`;
          } else {
            enderecoCompleto = `${orderData.endereco}${orderData.numero && !orderData.endereco.trim().endsWith(',') ? ', ' + orderData.numero : ' ' + (orderData.numero || '')}${orderData.complemento ? ', ' + orderData.complemento : ''}, ${orderData.bairro}, ${orderData.cidade}${!orderData.endereco.toLowerCase().includes('cep') ? ', CEP: ' + orderData.cep : ''}${orderData.pontoReferencia ? ', Referência: ' + orderData.pontoReferencia : ''}`;
          }
        } else {
          enderecoCompleto = `${orderData.endereco}${orderData.numero && !orderData.endereco.trim().endsWith(',') ? ', ' + orderData.numero : ' ' + (orderData.numero || '')}${orderData.complemento ? ', ' + orderData.complemento : ''}, ${orderData.bairro}, ${orderData.cidade}${!orderData.endereco.toLowerCase().includes('cep') ? ', CEP: ' + orderData.cep : ''}${orderData.pontoReferencia ? ', Referência: ' + orderData.pontoReferencia : ''}`;
        }
      }
      
      const invoiceData = {
        id: createdOrder.id,
        numeroOrdem: createdOrder.numero_pedido,
        nomeDestinatario: createdOrder.nome_cliente,
        telefone: orderData.telefone,
        endereco: enderecoCompleto,
        observacoes: orderData.observacoes,
        items: items.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          totalPrice: item.totalPrice !== undefined && item.totalPrice !== null 
            ? item.totalPrice 
            : item.price * item.quantity,
          customizations: item.customizations
        })),
        subtotal: Number(createdOrder.subtotal ?? calculatedValues.subtotal),
        taxaEntrega: Number(createdOrder.taxa_entrega ?? calculatedValues.taxaEntrega),
        desconto: Number(createdOrder.desconto ?? cupomAplicado?.desconto ?? 0),
        total: Number(createdOrder.valor_total ?? calculatedValues.totalAjustado),
        dataHora: new Date().toISOString(),
        formaPagamento: orderData.formaPagamento,
        whatsappUrl: urlPedidoWhatsApp(createdOrder) || undefined,
      };
      
      setInvoiceData(invoiceData);
      setShowInvoice(true);
      
      // Call the onFinishOrder callback
      onFinishOrder(createdOrder);
    } catch (error: unknown) {
      janelaWhatsApp?.close();
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error('Erro ao finalizar pedido:', errMsg);
      const erroDeCobertura = errMsg.toLowerCase().includes('área de entrega')
        || errMsg.toLowerCase().includes('fora da nossa área')
        || errMsg.toLowerCase().includes('não entregamos nesse endereço');
      if (erroDeCobertura) {
        setAreaIndisponivel(errMsg);
      } else {
        toast({
          title: "Erro ao finalizar pedido",
          description: errMsg || "Ocorreu um erro ao processar seu pedido. Por favor, tente novamente.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPixCode = () => {
    if (pixCopiaECola) {
      navigator.clipboard.writeText(pixCopiaECola);
      toast({
        title: "PIX Copia e Cola copiado",
        description: "Cole o código no aplicativo do seu banco.",
      });
    }
  };

  return (
    <>
      <Dialog open={open && !showInvoice} onOpenChange={handleClose}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {step === 'delivery-type' && 'Tipo de Entrega'}
              {step === 'address' && 'Endereço de Entrega'}
              {step === 'payment' && 'Forma de Pagamento'}
              {step === 'pix' && 'Pagamento PIX'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {step === 'delivery-type' && (
              <>
                <div className="space-y-4">
                  <RadioGroup value={tipoEntrega} onValueChange={(value: string) => setTipoEntrega(value as 'entrega' | 'retirada')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="entrega" id="entrega" />
                      <Label htmlFor="entrega">Entrega</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="retirada" id="retirada" />
                      <Label htmlFor="retirada">Retirada no Local</Label>
                    </div>
                  </RadioGroup>
                  
                  {tipoEntrega === 'retirada' && (
                    <div className="p-3 bg-gray-100 rounded-md text-sm">
                      <p className="font-medium">Endereço para retirada:</p>
                      <p>{enderecoEstabelecimento}</p>
                      <p>{cidadeEstabelecimento}-{estadoEstabelecimento}, CEP: {cepEstabelecimento}</p>
                      <p className="mt-2 text-xs text-gray-600">
                        * Taxa de entrega: Grátis para retirada
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button onClick={handleNext} className="btn-primary">
                    Próximo
                  </Button>
                </div>
              </>
            )}

            {step === 'address' && (
              <>
                <div className="space-y-4">
                  {tipoEntrega === 'entrega' && (
                    <>
                      {user && enderecos.length > 0 ? (
                        // User has saved addresses
                        <>
                          <div className="bg-blue-50 p-3 rounded-md">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-blue-800">Endereço salvo detectado</p>
                                <p className="text-sm text-blue-700">
                                  Usar o endereço principal do seu perfil?
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={useSavedAddress}
                                  onChange={(e) => setUseSavedAddress(e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-3300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                            
                            {useSavedAddress ? (
                              // Show saved address details instead of form
                              <div className="mt-3 space-y-2">
                                {enderecos.map((endereco) => (
                                  <button
                                    key={endereco.id}
                                    type="button"
                                    onClick={() => setSelectedEnderecoId(endereco.id)}
                                    className={`w-full rounded-xl border p-3 text-left text-sm ${
                                      enderecoSelecionado?.id === endereco.id
                                        ? 'border-primary bg-primary/10'
                                        : 'bg-white'
                                    }`}
                                  >
                                    <span className="font-semibold">
                                      {endereco.nome_endereco}
                                      {endereco.principal ? ' · Principal' : ''}
                                    </span>
                                    <span className="mt-1 block">
                                      {endereco.endereco_completo}, {endereco.numero}
                                      {endereco.complemento ? `, ${endereco.complemento}` : ''}
                                    </span>
                                    <span className="block text-muted-foreground">
                                      {endereco.bairro}, {endereco.cidade}/{endereco.estado} · CEP {endereco.cep}
                                    </span>
                                    {endereco.ponto_referencia && (
                                      <span className="block text-muted-foreground">
                                        Referência: {endereco.ponto_referencia}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              // Show form for new address
                              <>
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="nome">Nome Completo *</Label>
                                    <Input 
                                      id="nome" 
                                      value={orderData.nomeDestinatario} 
                                      onChange={(e) => setOrderData({...orderData, nomeDestinatario: e.target.value})}
                                      placeholder="Seu nome completo"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="telefone">Telefone *</Label>
                                    <Input 
                                      id="telefone" 
                                      value={orderData.telefone} 
                                      onChange={(e) => setOrderData({...orderData, telefone: e.target.value})}
                                      placeholder="(00) 00000-0000"
                                    />
                                    {user?.telefone && orderData.telefone === user.telefone && (
                                      <p className="text-xs text-gray-500">Preenchido automaticamente do seu perfil</p>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="cep-endereco-alternativo">CEP *</Label>
                                  <Input
                                    id="cep-endereco-alternativo"
                                    value={orderData.cep}
                                    onChange={(e) => void preencherEnderecoPeloCep(e.target.value)}
                                    placeholder="00000-000"
                                    inputMode="numeric"
                                    autoComplete="postal-code"
                                    maxLength={9}
                                  />
                                  <p className="text-xs text-muted-foreground">
                                    Digite o CEP para preencher rua, bairro, cidade e UF.
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="endereco">Endereço *</Label>
                                  <Input 
                                    id="endereco" 
                                    value={orderData.endereco} 
                                    onChange={(e) => setOrderData({...orderData, endereco: e.target.value})}
                                    placeholder="Rua, Avenida, etc."
                                  />
                                </div>
                                
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="numero">Número *</Label>
                                    <Input 
                                      id="numero" 
                                      value={orderData.numero} 
                                      onChange={(e) => setOrderData({...orderData, numero: e.target.value})}
                                      placeholder="123"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="complemento">Complemento</Label>
                                    <Input 
                                      id="complemento" 
                                      value={orderData.complemento} 
                                      onChange={(e) => setOrderData({...orderData, complemento: e.target.value})}
                                      placeholder="Apto, Bloco, etc."
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="bairro">Bairro *</Label>
                                    <Input 
                                      id="bairro" 
                                      value={orderData.bairro} 
                                      onChange={(e) => setOrderData({...orderData, bairro: e.target.value})}
                                      placeholder="Seu bairro"
                                    />
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2 col-span-2 sm:col-span-1">
                                    <Label htmlFor="cidade">Cidade *</Label>
                                    <Input 
                                      id="cidade" 
                                      value={orderData.cidade} 
                                      onChange={(e) => setOrderData({...orderData, cidade: e.target.value})}
                                      placeholder="Sua cidade"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="estado">UF *</Label>
                                    <Input
                                      id="estado"
                                      value={orderData.estado}
                                      onChange={(e) => setOrderData({
                                        ...orderData,
                                        estado: e.target.value.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase(),
                                      })}
                                      placeholder="BA"
                                      maxLength={2}
                                    />
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="ponto-referencia">Ponto de referência</Label>
                                  <Input
                                    id="ponto-referencia"
                                    value={orderData.pontoReferencia}
                                    onChange={(e) => setOrderData({
                                      ...orderData,
                                      pontoReferencia: e.target.value,
                                    })}
                                    placeholder="Ex.: Próximo à praça, portão azul"
                                    maxLength={150}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        // No saved addresses, show form
                        <>
                          {!user && enderecoVisitanteSalvo && (
                            <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 p-3">
                              <div>
                                <p className="font-medium">Endereço salvo neste dispositivo</p>
                                <p className="text-sm text-muted-foreground">
                                  Você pode alterar os campos abaixo ou excluir os dados.
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={excluirEnderecoVisitante}
                              >
                                Excluir
                              </Button>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="nome">Nome Completo *</Label>
                              <Input 
                                id="nome" 
                                value={orderData.nomeDestinatario} 
                                onChange={(e) => setOrderData({...orderData, nomeDestinatario: e.target.value})}
                                placeholder="Seu nome completo"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="telefone">Telefone *</Label>
                              <Input 
                                id="telefone" 
                                value={orderData.telefone} 
                                onChange={(e) => setOrderData({...orderData, telefone: e.target.value})}
                                placeholder="(00) 00000-0000"
                              />
                              {user?.telefone && orderData.telefone === user.telefone && (
                                <p className="text-xs text-gray-500">Preenchido automaticamente do seu perfil</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="cep-endereco-visitante">CEP *</Label>
                            <Input
                              id="cep-endereco-visitante"
                              value={orderData.cep}
                              onChange={(e) => void preencherEnderecoPeloCep(e.target.value)}
                              placeholder="00000-000"
                              inputMode="numeric"
                              autoComplete="postal-code"
                              maxLength={9}
                            />
                            <p className="text-xs text-muted-foreground">
                              Digite o CEP para preencher rua, bairro, cidade e UF.
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="endereco">Endereço *</Label>
                            <Input 
                              id="endereco" 
                              value={orderData.endereco} 
                              onChange={(e) => setOrderData({...orderData, endereco: e.target.value})}
                              placeholder="Rua, Avenida, etc."
                            />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="numero">Número *</Label>
                              <Input 
                                id="numero" 
                                value={orderData.numero} 
                                onChange={(e) => setOrderData({...orderData, numero: e.target.value})}
                                placeholder="123"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="complemento">Complemento</Label>
                              <Input 
                                id="complemento" 
                                value={orderData.complemento} 
                                onChange={(e) => setOrderData({...orderData, complemento: e.target.value})}
                                placeholder="Apto, Bloco, etc."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="bairro">Bairro *</Label>
                              <Input 
                                id="bairro" 
                                value={orderData.bairro} 
                                onChange={(e) => setOrderData({...orderData, bairro: e.target.value})}
                                placeholder="Seu bairro"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2 sm:col-span-1">
                              <Label htmlFor="cidade">Cidade *</Label>
                              <Input 
                                id="cidade" 
                                value={orderData.cidade} 
                                onChange={(e) => setOrderData({...orderData, cidade: e.target.value})}
                                placeholder="Sua cidade"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="estado">UF *</Label>
                              <Input
                                id="estado"
                                value={orderData.estado}
                                onChange={(e) => setOrderData({
                                  ...orderData,
                                  estado: e.target.value.replace(/[^a-z]/gi, '').slice(0, 2).toUpperCase(),
                                })}
                                placeholder="BA"
                                maxLength={2}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ponto-referencia-visitante">Ponto de referência</Label>
                            <Input
                              id="ponto-referencia-visitante"
                              value={orderData.pontoReferencia}
                              onChange={(e) => setOrderData({
                                ...orderData,
                                pontoReferencia: e.target.value,
                              })}
                              placeholder="Ex.: Próximo à praça, portão azul"
                              maxLength={150}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                  
                  {tipoEntrega === 'entrega' && user && !usandoEnderecoSalvo && (
                    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3">
                      <input
                        type="checkbox"
                        checked={salvarNovoEndereco}
                        onChange={(event) => setSalvarNovoEndereco(event.target.checked)}
                        className="h-5 w-5"
                      />
                      <span className="text-sm font-medium">
                        Salvar este endereço para os próximos pedidos
                      </span>
                    </label>
                  )}

                  {/* Observações section - always show */}
                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea 
                      id="observacoes" 
                      value={orderData.observacoes} 
                      onChange={(e) => setOrderData({...orderData, observacoes: e.target.value})}
                      placeholder="Alguma observação sobre o pedido ou entrega?"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    Voltar
                  </Button>
                  <Button onClick={handleNext} className="btn-primary">
                    Próximo
                  </Button>
                </div>
              </>
            )}

            {step === 'payment' && (
              <>
                <div className="space-y-4">
                  <RadioGroup
                    value={orderData.formaPagamento}
                    onValueChange={(value: string) => {
                      setOrderData({ ...orderData, formaPagamento: value });
                      if (value !== 'dinheiro') {
                        setPrecisaTroco(false);
                        setTrocoParaCentavos(0);
                      }
                    }}
                    className="grid gap-3"
                  >
                    <div className="flex min-h-14 items-center space-x-3 rounded-xl border p-4">
                      <RadioGroupItem value="pix" id="pix" />
                      <Label htmlFor="pix" className="flex-1 cursor-pointer text-base font-semibold">PIX</Label>
                    </div>
                    <div className="flex min-h-14 items-center space-x-3 rounded-xl border p-4">
                      <RadioGroupItem value="dinheiro" id="dinheiro" />
                      <Label htmlFor="dinheiro" className="flex-1 cursor-pointer text-base font-semibold">Dinheiro</Label>
                    </div>
                  </RadioGroup>

                  {orderData.formaPagamento === 'dinheiro' && (
                    <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
                      <div>
                        <p className="font-semibold">Precisa de troco?</p>
                        <p className="text-sm text-muted-foreground">
                          Informe se o entregador deve levar troco.
                        </p>
                      </div>
                      <RadioGroup
                        value={precisaTroco ? 'sim' : 'nao'}
                        onValueChange={(value) => {
                          const precisa = value === 'sim';
                          setPrecisaTroco(precisa);
                          if (!precisa) setTrocoParaCentavos(0);
                        }}
                        className="grid grid-cols-2 gap-3"
                      >
                        <Label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border bg-background p-3">
                          <RadioGroupItem value="nao" />
                          Não
                        </Label>
                        <Label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border bg-background p-3">
                          <RadioGroupItem value="sim" />
                          Sim
                        </Label>
                      </RadioGroup>
                      {precisaTroco && (
                        <div className="space-y-2">
                          <Label htmlFor="troco-para">Troco para quanto?</Label>
                          <Input
                            id="troco-para"
                            type="text"
                            inputMode="numeric"
                            value={formatarValorEmReais(trocoParaCentavos)}
                            onChange={(event) => alterarValorTroco(event.target.value)}
                            className="h-12 text-lg font-semibold"
                            aria-describedby="troco-resumo"
                          />
                          <p id="troco-resumo" className="text-sm text-muted-foreground">
                            {trocoParaCentavos / 100 > calculatedValues.totalAjustado
                              ? `Troco: ${formatarValorEmReais(
                                trocoParaCentavos
                                  - Math.round(calculatedValues.totalAjustado * 100),
                              )}`
                              : 'O valor deve ser maior que o total do pedido.'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2 rounded-xl border p-3">
                    <Label htmlFor="cupom">Cupom de desconto</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cupom"
                        value={cupomCodigo}
                        onChange={(event) => {
                          setCupomCodigo(event.target.value.toUpperCase());
                          setCupomAplicado(null);
                        }}
                        placeholder="Digite o código"
                        maxLength={40}
                        disabled={validandoCupom}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void aplicarCupom()}
                        disabled={!cupomCodigo.trim() || validandoCupom}
                      >
                        {validandoCupom ? 'Validando...' : 'Aplicar'}
                      </Button>
                    </div>
                    {cupomAplicado && (
                      <p className="text-sm font-medium text-green-700">
                        Cupom {cupomAplicado.codigo} aplicado.
                      </p>
                    )}
                  </div>
                  {!user && (
                    <p className="rounded-xl border p-3 text-sm text-muted-foreground">
                      Alguns cupons são exclusivos para clientes cadastrados. Cupons liberados
                      para visitantes podem ser aplicados normalmente.
                    </p>
                  )}
                  
                  <div className="border-t pt-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedValues.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de Entrega:</span>
                        <span>
                          {calculatedValues.taxaEntrega === 0 
                            ? "Grátis" 
                            : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedValues.taxaEntrega)
                          }
                        </span>
                      </div>
                      {cupomAplicado && (
                        <div className="flex justify-between text-green-700">
                          <span>Desconto:</span>
                          <span>
                            -{new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(cupomAplicado.desconto)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span className="text-[hsl(var(--button-primary-bg))]">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedValues.totalAjustado)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handleBack}>
                    Voltar
                  </Button>
                  <Button onClick={handleNext} className="btn-primary">
                    {orderData.formaPagamento === 'pix' ? 'Pagar com PIX' : 'Finalizar Pedido'}
                  </Button>
                </div>
              </>
            )}

            {step === 'pix' && (
              <>
                <div className="space-y-4 text-center">
                  <div className="p-4 bg-gray-100 rounded-lg">
                    <QrCode className="h-32 w-32 mx-auto" />
                    {qrCodeUrl && (
                      <img src={qrCodeUrl} alt="QR Code PIX" className="h-32 w-32 mx-auto" />
                    )}
                  </div>
                  
                  <div className="text-sm space-y-2">
                    <p className="font-medium">Valor: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(pedidoCriado?.valor_total || 0))}</p>
                    <p>Escaneie o QR Code acima com seu app bancário para pagar com PIX</p>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <p className="font-medium text-blue-800">Instruções:</p>
                      <ol className="list-decimal list-inside text-left text-blue-700 mt-1 space-y-1">
                        <li>Abra seu app bancário</li>
                        <li>Selecione a opção PIX</li>
                        <li>Escolha "Pagar com QR Code"</li>
                        <li>Aponte a câmera para o QR Code acima</li>
                        <li>Confirme o valor e finalize o pagamento</li>
                      </ol>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 rounded-md">
                      <p className="font-medium mb-1">Chave PIX:</p>
                      <p className="font-mono text-sm break-all">{configuracao?.chave_pix || 'Chave PIX não configurada'}</p>
                      {configuracao?.nome_recebedor_pix && (
                        <p className="text-sm mt-1">Nome: {configuracao.nome_recebedor_pix}</p>
                      )}
                      {configuracao?.cidade_recebedor_pix && (
                        <p className="text-sm">Cidade: {configuracao.cidade_recebedor_pix}</p>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 w-full"
                        onClick={copyPixCode}
                        disabled={!pixCopiaECola}
                      >
                        Copiar código PIX
                      </Button>
                    </div>
                    
                    {configuracao?.mensagem_pix && (
                      <div className="p-3 bg-blue-50 rounded-md">
                        <p className="font-medium mb-1">Mensagem:</p>
                        <p className="text-sm">{configuracao.mensagem_pix}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-900">
                    O pedido foi registrado e ficará aguardando a confirmação do pagamento.
                  </p>
                  <Button onClick={handleFinishOrder} className="btn-primary">
                    Já efetuei o PIX
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <InvoiceModal 
        open={showInvoice}
        onClose={handleInvoiceClose}
        invoiceData={invoiceData}
      />

      <AlertDialog
        open={Boolean(areaIndisponivel)}
        onOpenChange={(aberto) => {
          if (!aberto) setAreaIndisponivel('');
        }}
      >
        <AlertDialogContent className="max-w-md rounded-3xl">
          <AlertDialogHeader className="items-center text-center sm:items-start sm:text-left">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 text-amber-700">
              <MapPinOff className="h-7 w-7" />
            </div>
            <AlertDialogTitle>Endereço fora da área de entrega</AlertDialogTitle>
            <AlertDialogDescription className="text-base leading-relaxed">
              {areaIndisponivel}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction className="min-h-12 w-full rounded-xl">
              Alterar endereço
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
