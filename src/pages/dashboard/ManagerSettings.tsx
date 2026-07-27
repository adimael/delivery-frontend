import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useEstabelecimento, ConfiguracaoEstabelecimento } from "@/hooks/useEstabelecimento";
import { useToast } from "@/hooks/use-toast";
import { MapPinned, Plus, Save, CreditCard, Trash2, Truck, Palette } from "lucide-react";
import { formatarCnpj, validarCnpj } from "@/lib/cnpj";
import { buscarEnderecoPorCep, formatarCep } from "@/lib/cep";

const formatarTelefone = (valor: string): string => {
  const digitos = valor.replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 2) return digitos ? `(${digitos}` : '';
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
};

const valorBooleano = (valor: unknown): boolean =>
  valor === true || valor === 1 || valor === '1' || valor === 'true';

const ManagerSettings = () => {
  const { configuracao, loading, atualizarConfiguracao } = useEstabelecimento();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const configuracaoInicialCarregada = useRef(false);
  const formularioEmEdicao = useRef(false);

  const [formData, setFormData] = useState<Partial<ConfiguracaoEstabelecimento>>({
    nome_plataforma: configuracao?.nome_plataforma || 'Meu Delivery',
    cnpj: configuracao?.cnpj || '',
    descricao_plataforma: configuracao?.descricao_plataforma || '',
    url_icone_plataforma: configuracao?.url_icone_plataforma || '',
    url_capa_plataforma: configuracao?.url_capa_plataforma || '',
    url_frontend: configuracao?.url_frontend || window.location.origin,
    slogan_plataforma: configuracao?.slogan_plataforma || '',
    categoria_estabelecimento: configuracao?.categoria_estabelecimento || '',
    texto_chamada_endereco: configuracao?.texto_chamada_endereco || '',
    whatsapp: configuracao?.whatsapp || '',
    instagram: configuracao?.instagram || '',
    cor_primaria: configuracao?.cor_primaria || '#3b82f6',
    cor_secundaria: configuracao?.cor_secundaria || '#1e40af',
    cor_navbar: configuracao?.cor_navbar || configuracao?.cor_primaria || '#3b82f6',
    cor_footer: configuracao?.cor_footer || configuracao?.cor_secundaria || '#1e40af',
    cor_section_header: configuracao?.cor_section_header || '#f3f4f6',
    cor_section_produtos: configuracao?.cor_section_produtos || '#ffffff',
    cor_section_comprar: configuracao?.cor_section_comprar || '#f9fafb',
    cor_section_contato: configuracao?.cor_section_contato || configuracao?.cor_primaria || '#3b82f6',
    cor_botoes: configuracao?.cor_botoes || configuracao?.cor_primaria || '#3b82f6',
    cor_icones: configuracao?.cor_icones || configuracao?.cor_primaria || '#3b82f6',
    chave_pix: configuracao?.chave_pix || '',
    mensagem_pix: configuracao?.mensagem_pix || '⏰ Após efetuar o pagamento, seu pedido será confirmado automaticamente e você receberá uma notificação.',
    taxa_entrega: configuracao?.taxa_entrega || 5.00,
    valor_minimo_frete_gratis: configuracao?.valor_minimo_frete_gratis || 50.00,
    localidades_frete_gratis: configuracao?.localidades_frete_gratis || [],
    entrega_restrita: configuracao?.entrega_restrita ?? false,
    areas_entrega: configuracao?.areas_entrega || [],
    nome_recebedor_pix: configuracao?.nome_recebedor_pix || '',
    cidade_recebedor_pix: configuracao?.cidade_recebedor_pix || '',
    cep_recebedor_pix: configuracao?.cep_recebedor_pix || '',
    aberto: configuracao?.aberto ?? true,
    hora_abertura: configuracao?.hora_abertura || '08:00',
    hora_fechamento: configuracao?.hora_fechamento || '18:00',
    // Establishment address fields
    endereco_estabelecimento: configuracao?.endereco_estabelecimento || '',
    bairro_estabelecimento: configuracao?.bairro_estabelecimento || '',
    cidade_estabelecimento: configuracao?.cidade_estabelecimento || '',
    estado_estabelecimento: configuracao?.estado_estabelecimento || '',
    cep_estabelecimento: configuracao?.cep_estabelecimento || '',
    // Individual day schedules
    aberto_segunda: configuracao?.aberto_segunda ?? true,
    hora_abertura_segunda: configuracao?.hora_abertura_segunda || '08:00',
    hora_fechamento_segunda: configuracao?.hora_fechamento_segunda || '18:00',
    aberto_terca: configuracao?.aberto_terca ?? true,
    hora_abertura_terca: configuracao?.hora_abertura_terca || '08:00',
    hora_fechamento_terca: configuracao?.hora_fechamento_terca || '18:00',
    aberto_quarta: configuracao?.aberto_quarta ?? true,
    hora_abertura_quarta: configuracao?.hora_abertura_quarta || '08:00',
    hora_fechamento_quarta: configuracao?.hora_fechamento_quarta || '18:00',
    aberto_quinta: configuracao?.aberto_quinta ?? true,
    hora_abertura_quinta: configuracao?.hora_abertura_quinta || '08:00',
    hora_fechamento_quinta: configuracao?.hora_fechamento_quinta || '18:00',
    aberto_sexta: configuracao?.aberto_sexta ?? true,
    hora_abertura_sexta: configuracao?.hora_abertura_sexta || '08:00',
    hora_fechamento_sexta: configuracao?.hora_fechamento_sexta || '18:00',
    aberto_sabado: configuracao?.aberto_sabado ?? true,
    hora_abertura_sabado: configuracao?.hora_abertura_sabado || '08:00',
    hora_fechamento_sabado: configuracao?.hora_fechamento_sabado || '12:00',
    aberto_domingo: configuracao?.aberto_domingo ?? false,
    hora_abertura_domingo: configuracao?.hora_abertura_domingo || '00:00',
    hora_fechamento_domingo: configuracao?.hora_fechamento_domingo || '00:00',
  });

  useEffect(() => {
    if (
      configuracao
      && (
        !configuracaoInicialCarregada.current
        || !formularioEmEdicao.current
      )
    ) {
      setFormData({
        nome_plataforma: configuracao.nome_plataforma || 'Meu Delivery',
        cnpj: configuracao.cnpj || '',
        descricao_plataforma: configuracao.descricao_plataforma || '',
        url_icone_plataforma: configuracao.url_icone_plataforma || '',
        url_capa_plataforma: configuracao.url_capa_plataforma || '',
        url_frontend: configuracao.url_frontend || window.location.origin,
        slogan_plataforma: configuracao.slogan_plataforma || '',
        categoria_estabelecimento: configuracao.categoria_estabelecimento || '',
        texto_chamada_endereco: configuracao.texto_chamada_endereco || '',
        whatsapp: configuracao.whatsapp || '',
        instagram: configuracao.instagram || '',
        cor_primaria: configuracao.cor_primaria || '#3b82f6',
        cor_secundaria: configuracao.cor_secundaria || '#1e40af',
        cor_navbar: configuracao.cor_navbar || configuracao.cor_primaria || '#3b82f6',
        cor_footer: configuracao.cor_footer || configuracao.cor_secundaria || '#1e40af',
        cor_section_header: configuracao.cor_section_header || '#f3f4f6',
        cor_section_produtos: configuracao.cor_section_produtos || '#ffffff',
        cor_section_comprar: configuracao.cor_section_comprar || '#f9fafb',
        cor_section_contato: configuracao.cor_section_contato || configuracao.cor_primaria || '#3b82f6',
        cor_botoes: configuracao.cor_botoes || configuracao.cor_primaria || '#3b82f6',
        cor_icones: configuracao.cor_icones || configuracao.cor_primaria || '#3b82f6',
        chave_pix: configuracao.chave_pix || '',
        mensagem_pix: configuracao.mensagem_pix || '⏰ Após efetuar o pagamento, seu pedido será confirmado automaticamente e você receberá uma notificação.',
        taxa_entrega: configuracao.taxa_entrega || 5.00,
        valor_minimo_frete_gratis: configuracao.valor_minimo_frete_gratis || 50.00,
        localidades_frete_gratis: configuracao.localidades_frete_gratis || [],
        entrega_restrita: configuracao.entrega_restrita ?? false,
        areas_entrega: configuracao.areas_entrega || [],
        nome_recebedor_pix: configuracao.nome_recebedor_pix || '',
        cidade_recebedor_pix: configuracao.cidade_recebedor_pix || '',
        cep_recebedor_pix: configuracao.cep_recebedor_pix || '',
        aberto: configuracao.aberto ?? true,
        hora_abertura: configuracao.hora_abertura || '08:00',
        hora_fechamento: configuracao.hora_fechamento || '18:00',
        // Establishment address fields
        endereco_estabelecimento: configuracao.endereco_estabelecimento || '',
        bairro_estabelecimento: configuracao.bairro_estabelecimento || '',
        cidade_estabelecimento: configuracao.cidade_estabelecimento || '',
        estado_estabelecimento: configuracao.estado_estabelecimento || '',
        cep_estabelecimento: configuracao.cep_estabelecimento || '',
        // Individual day schedules
        aberto_segunda: configuracao.aberto_segunda ?? true,
        hora_abertura_segunda: configuracao.hora_abertura_segunda || '08:00',
        hora_fechamento_segunda: configuracao.hora_fechamento_segunda || '18:00',
        aberto_terca: configuracao.aberto_terca ?? true,
        hora_abertura_terca: configuracao.hora_abertura_terca || '08:00',
        hora_fechamento_terca: configuracao.hora_fechamento_terca || '18:00',
        aberto_quarta: configuracao.aberto_quarta ?? true,
        hora_abertura_quarta: configuracao.hora_abertura_quarta || '08:00',
        hora_fechamento_quarta: configuracao.hora_fechamento_quarta || '18:00',
        aberto_quinta: configuracao.aberto_quinta ?? true,
        hora_abertura_quinta: configuracao.hora_abertura_quinta || '08:00',
        hora_fechamento_quinta: configuracao.hora_fechamento_quinta || '18:00',
        aberto_sexta: configuracao.aberto_sexta ?? true,
        hora_abertura_sexta: configuracao.hora_abertura_sexta || '08:00',
        hora_fechamento_sexta: configuracao.hora_fechamento_sexta || '18:00',
        aberto_sabado: configuracao.aberto_sabado ?? true,
        hora_abertura_sabado: configuracao.hora_abertura_sabado || '08:00',
        hora_fechamento_sabado: configuracao.hora_fechamento_sabado || '12:00',
        aberto_domingo: configuracao.aberto_domingo ?? false,
        hora_abertura_domingo: configuracao.hora_abertura_domingo || '00:00',
        hora_fechamento_domingo: configuracao.hora_fechamento_domingo || '00:00',
      });
      configuracaoInicialCarregada.current = true;
    }
  }, [configuracao]);

  const handleSave = async () => {
    if (formData.cnpj && !validarCnpj(formData.cnpj)) {
      toast({
        title: "CNPJ inválido",
        description: "Informe um CNPJ numérico ou alfanumérico válido.",
        variant: "destructive",
      });
      return;
    }
    if (valorBooleano(formData.entrega_restrita)) {
      const areaComCepInvalido = (formData.areas_entrega || []).some((area) => {
        const cep = String(area.cep || '').replace(/\D/g, '');
        return cep !== '' && cep.length !== 8;
      });
      if (areaComCepInvalido) {
        toast({
          title: "CEP inválido",
          description: "Informe um CEP com 8 dígitos ou deixe o campo vazio para atender toda a cidade.",
          variant: "destructive",
        });
        return;
      }
      const areasValidas = (formData.areas_entrega || []).filter(
        (area) => area.cidade.trim() !== '' && /^[A-Z]{2}$/.test(area.estado.trim().toUpperCase()),
      );
      if (areasValidas.length === 0) {
        toast({
          title: "Defina a área de entrega",
          description: "Adicione pelo menos uma cidade e uma UF válidas antes de ativar a restrição.",
          variant: "destructive",
        });
        return;
      }
    }
    setSaving(true);
    try {
      
      const success = await atualizarConfiguracao(formData);

      if (success) {
        formularioEmEdicao.current = false;
        toast({
          title: "Configurações salvas",
          description: "As configurações do estabelecimento foram atualizadas com sucesso.",
        });
      } else {
        toast({
          title: "Erro ao salvar",
          description: "Ocorreu um erro ao salvar as configurações.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error
          ? error.message
          : "Ocorreu um erro ao salvar as configurações.",
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  // Function to render color picker with text input
  const renderColorPicker = (id: string, label: string, value: string, onChange: (value: string) => void) => (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2 mt-1">
        <Input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-16 h-10 p-1"
        />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#3b82f6"
          className="flex-1"
        />
      </div>
    </div>
  );

  // Update specific colors when primary/secondary colors change
  const handlePrimaryColorChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      cor_primaria: value,
      // Update dependent colors if they match the previous primary color
      cor_navbar: prev?.cor_navbar === prev?.cor_primaria ? value : prev?.cor_navbar,
      cor_section_contato: prev?.cor_section_contato === prev?.cor_primaria ? value : prev?.cor_section_contato,
      cor_botoes: prev?.cor_botoes === prev?.cor_primaria ? value : prev?.cor_botoes,
      cor_icones: prev?.cor_icones === prev?.cor_primaria ? value : prev?.cor_icones,
    }));
  };

  const handleSecondaryColorChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      cor_secundaria: value,
      // Update dependent colors if they match the previous secondary color
      cor_footer: prev?.cor_footer === prev?.cor_secundaria ? value : prev?.cor_footer,
    }));
  };

  // Function to check if a day schedule matches the default values
  const isDefaultSchedule = (dayKey: string) => {
    const defaultValues = {
      aberto: dayKey === 'domingo' ? false : true,
      hora_abertura: dayKey === 'sabado' ? '08:00' : (dayKey === 'domingo' ? '00:00' : '08:00'),
      hora_fechamento: dayKey === 'sabado' ? '12:00' : (dayKey === 'domingo' ? '00:00' : '18:00')
    };
    
    return (
      formData[`aberto_${dayKey}`] === defaultValues.aberto &&
      formData[`hora_abertura_${dayKey}`] === defaultValues.hora_abertura &&
      formData[`hora_fechamento_${dayKey}`] === defaultValues.hora_fechamento
    );
  };

  // Function to update general schedule and sync with individual day schedules that use default values
  const handleGeneralScheduleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updatedData = { ...prev, [field]: value };
      
      // If changing general opening or closing time, update individual days that still use defaults
      if (field === 'hora_abertura' || field === 'hora_fechamento') {
        const days = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
        
        days.forEach(day => {
          // Only update if the day still uses default values
          if (isDefaultSchedule(day)) {
            if (day === 'sabado' && field === 'hora_fechamento') {
              // Saturday has a different default closing time, so don't update it
              return;
            }
            if (day === 'domingo') {
              // Sunday is closed by default, so don't update times
              return;
            }
            
            updatedData[`hora_${field === 'hora_abertura' ? 'abertura' : 'fechamento'}_${day}`] = value;
          }
        });
      }
      
      return updatedData;
    });
  };

  const preencherEstabelecimentoPeloCep = async (valor: string) => {
    const cep = formatarCep(valor);
    setFormData(prev => ({ ...prev, cep_estabelecimento: cep }));
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
      setFormData(prev => ({
        ...prev,
        cep_estabelecimento: dados.cep,
        endereco_estabelecimento: dados.logradouro || prev.endereco_estabelecimento,
        bairro_estabelecimento: dados.bairro || prev.bairro_estabelecimento,
        cidade_estabelecimento: dados.cidade || prev.cidade_estabelecimento,
        estado_estabelecimento: dados.estado || prev.estado_estabelecimento,
      }));
    } catch {
      toast({
        title: "Consulta de CEP indisponível",
        description: "Preencha o endereço manualmente e tente salvar novamente.",
        variant: "destructive",
      });
    }
  };

  const preencherRecebedorPeloCep = async (valor: string) => {
    const cep = formatarCep(valor);
    setFormData(prev => ({ ...prev, cep_recebedor_pix: cep }));
    if (cep.replace(/\D/g, '').length !== 8) return;

    try {
      const dados = await buscarEnderecoPorCep(cep);
      if (!dados) return;
      setFormData(prev => ({
        ...prev,
        cep_recebedor_pix: dados.cep,
        cidade_recebedor_pix: dados.cidade || prev.cidade_recebedor_pix,
      }));
    } catch {
      // O CEP do PIX é opcional e permanece editável.
    }
  };

  const preencherAreaPeloCep = async (indice: number, valor: string) => {
    formularioEmEdicao.current = true;
    const cep = formatarCep(valor);
    setFormData(prev => ({
      ...prev,
      areas_entrega: (prev.areas_entrega || []).map((area, atual) => (
        atual === indice ? { ...area, cep } : area
      )),
    }));
    if (cep.replace(/\D/g, '').length !== 8) return;

    try {
      const dados = await buscarEnderecoPorCep(cep);
      if (!dados) {
        toast({
          title: "CEP não encontrado",
          description: "Confira o CEP informado para esta área de entrega.",
          variant: "destructive",
        });
        return;
      }
      setFormData(prev => ({
        ...prev,
        areas_entrega: (prev.areas_entrega || []).map((area, atual) => (
          atual === indice
            ? {
                ...area,
                cep: dados.cep,
                cidade: dados.cidade,
                estado: dados.estado,
              }
            : area
        )),
      }));
    } catch {
      toast({
        title: "Consulta de CEP indisponível",
        description: "Você ainda pode preencher a cidade e a UF manualmente.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Configurações" userType="manager">
        <div>Carregando...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Configurações" userType="manager">
      <div
        className="space-y-6"
        onChangeCapture={() => {
          formularioEmEdicao.current = true;
        }}
      >
        {/* Personalização da Plataforma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="mr-2 h-5 w-5" />
              Personalização da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="nome_plataforma">Nome da Plataforma</Label>
              <Input
                id="nome_plataforma"
                value={formData.nome_plataforma}
                onChange={(e) => setFormData(prev => ({ ...prev, nome_plataforma: e.target.value }))}
                placeholder="Nome da sua plataforma"
              />
            </div>

            <div>
              <Label htmlFor="cnpj">CNPJ (Opcional)</Label>
              <Input
                id="cnpj"
                value={formData.cnpj || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cnpj: formatarCnpj(e.target.value) }))}
                placeholder="00.000.000/0000-00"
                className="font-mono uppercase"
                maxLength={18}
              />
              <p className="text-sm text-gray-500 mt-1">
                CNPJ da empresa (opcional, será exibido na nota fiscal)
              </p>
            </div>

            <div>
              <Label htmlFor="descricao_plataforma">Descrição da Plataforma</Label>
              <Textarea
                id="descricao_plataforma"
                value={formData.descricao_plataforma}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao_plataforma: e.target.value }))}
                placeholder="Descrição da sua plataforma"
                rows={3}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label htmlFor="slogan_plataforma">Texto de destaque do cardápio</Label>
                <Input
                  id="slogan_plataforma"
                  maxLength={160}
                  value={formData.slogan_plataforma || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, slogan_plataforma: e.target.value }))}
                  placeholder="Ex.: Massas preparadas do seu jeito"
                />
                <p className="mt-1 text-sm text-gray-500">Substitui o texto exibido ao lado do nome da loja.</p>
              </div>
              <div>
                <Label htmlFor="categoria_estabelecimento">Categoria do estabelecimento</Label>
                <Input
                  id="categoria_estabelecimento"
                  maxLength={100}
                  value={formData.categoria_estabelecimento || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoria_estabelecimento: e.target.value }))}
                  placeholder="Ex.: Restaurante, Pizzaria, Comida rápida"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="texto_chamada_endereco">Chamada para endereço de entrega</Label>
              <Input
                id="texto_chamada_endereco"
                maxLength={160}
                value={formData.texto_chamada_endereco || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, texto_chamada_endereco: e.target.value }))}
                placeholder="Ex.: Informe onde deseja receber seu pedido"
              />
            </div>

            <div>
              <Label htmlFor="url_icone_plataforma">URL do Ícone/Favicon</Label>
              <Input
                id="url_icone_plataforma"
                value={formData.url_icone_plataforma || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, url_icone_plataforma: e.target.value }))}
                placeholder="https://exemplo.com/icone.png"
              />
              <p className="text-sm text-gray-500 mt-1">
                URL da imagem que será usada como ícone e favicon da plataforma
              </p>
            </div>

            <div>
              <Label htmlFor="url_capa_plataforma">URL da imagem de capa</Label>
              <Input
                id="url_capa_plataforma"
                value={formData.url_capa_plataforma || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, url_capa_plataforma: e.target.value }))}
                placeholder="https://exemplo.com/capa.jpg"
              />
            </div>

            <div>
              <Label htmlFor="url_frontend">URL pública da loja</Label>
              <Input
                id="url_frontend"
                type="url"
                value={formData.url_frontend || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, url_frontend: e.target.value }))}
                placeholder="https://delivery.exemplo.com"
              />
              <p className="mt-1 text-sm text-gray-500">Usada nos links enviados para recuperação de senha.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="whatsapp">Número do WhatsApp</Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  inputMode="numeric"
                  value={formData.whatsapp || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    whatsapp: formatarTelefone(e.target.value),
                  }))}
                  placeholder="(73) 99811-2863"
                  maxLength={15}
                  autoComplete="tel"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Número do WhatsApp para contato com os clientes
                </p>
              </div>

              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  value={formData.instagram || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                  placeholder="aadr_modas"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Nome de usuário do Instagram (sem @)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderColorPicker(
                "cor_primaria",
                "Cor Primária",
                formData.cor_primaria || '#3b82f6',
                handlePrimaryColorChange
              )}

              {renderColorPicker(
                "cor_secundaria",
                "Cor Secundária",
                formData.cor_secundaria || '#1e40af',
                handleSecondaryColorChange
              )}

              {renderColorPicker(
                "cor_navbar",
                "Cor da Barra de Navegação",
                formData.cor_navbar || '#3b82f6',
                (value) => setFormData(prev => ({ ...prev, cor_navbar: value }))
              )}

              {renderColorPicker(
                "cor_footer",
                "Cor do Rodapé",
                formData.cor_footer || '#1e40af',
                (value) => setFormData(prev => ({ ...prev, cor_footer: value }))
              )}

              {renderColorPicker(
                "cor_section_header",
                "Cor da Seção de Cabeçalho",
                formData.cor_section_header || '#f3f4f6',
                (value) => setFormData(prev => ({ ...prev, cor_section_header: value }))
              )}

              {renderColorPicker(
                "cor_section_produtos",
                "Cor da Seção de Produtos",
                formData.cor_section_produtos || '#ffffff',
                (value) => setFormData(prev => ({ ...prev, cor_section_produtos: value }))
              )}

              {renderColorPicker(
                "cor_section_comprar",
                "Cor da Seção 'Como Comprar'",
                formData.cor_section_comprar || '#f9fafb',
                (value) => setFormData(prev => ({ ...prev, cor_section_comprar: value }))
              )}

              {renderColorPicker(
                "cor_section_contato",
                "Cor da Seção de Contato",
                formData.cor_section_contato || '#3b82f6',
                (value) => setFormData(prev => ({ ...prev, cor_section_contato: value }))
              )}

              {renderColorPicker(
                "cor_botoes",
                "Cor dos Botões",
                formData.cor_botoes || '#3b82f6',
                (value) => setFormData(prev => ({ ...prev, cor_botoes: value }))
              )}

              {renderColorPicker(
                "cor_icones",
                "Cor dos Ícones",
                formData.cor_icones || '#3b82f6',
                (value) => setFormData(prev => ({ ...prev, cor_icones: value }))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Truck className="mr-2 h-5 w-5" />
              Configurações de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="taxa_entrega">Taxa de Entrega (R$)</Label>
              <Input
                id="taxa_entrega"
                type="number"
                min="0"
                step="0.01"
                value={formData.taxa_entrega}
                onChange={(e) => setFormData(prev => ({ ...prev, taxa_entrega: Number(e.target.value) }))}
              />
              <p className="text-sm text-gray-500 mt-1">
                Taxa cobrada para entrega dos pedidos
              </p>
            </div>
            
            <div>
              <Label htmlFor="valor_minimo_frete_gratis">Valor Mínimo para Frete Grátis (R$)</Label>
              <Input
                id="valor_minimo_frete_gratis"
                type="number"
                min="0"
                step="0.01"
                value={formData.valor_minimo_frete_gratis}
                onChange={(e) => setFormData(prev => ({ ...prev, valor_minimo_frete_gratis: Number(e.target.value) }))}
              />
              <p className="text-sm text-gray-500 mt-1">
                Pedidos acima deste valor terão frete grátis (0 = sempre cobrar taxa)
              </p>
            </div>
            
            <div>
              <Label htmlFor="localidades_frete_gratis">Bairros/localidades com frete grátis</Label>
              <Textarea
                id="localidades_frete_gratis"
                value={(formData.localidades_frete_gratis || []).join('\n')}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  localidades_frete_gratis: e.target.value
                    .split(/\r?\n|,/)
                    .map(item => item.trim())
                    .filter(Boolean),
                }))}
                placeholder={"Centro\nBairro Novo"}
                rows={4}
              />
              <p className="text-sm text-gray-500 mt-1">Uma localidade por linha. A comparação ignora maiúsculas e acentos.</p>
            </div>

            <div className="rounded-3xl border bg-muted/20 p-4 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPinned className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-bold">Limite da área de entrega</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Permita pedidos somente nas cidades e localidades cadastradas abaixo.
                  </p>
                </div>
                <Switch
                  checked={valorBooleano(formData.entrega_restrita)}
                  onCheckedChange={(checked) => {
                    formularioEmEdicao.current = true;
                    setFormData(prev => ({
                      ...prev,
                      entrega_restrita: checked,
                    }));
                  }}
                  aria-label="Restringir área de entrega"
                />
              </div>

              {valorBooleano(formData.entrega_restrita) && (
                <div className="mt-5 space-y-4">
                  {(formData.areas_entrega || []).map((area, indice) => (
                    <div key={indice} className="rounded-2xl border bg-background p-4">
                      <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)_110px_auto]">
                        <div>
                          <Label htmlFor={`area-cep-${indice}`}>CEP</Label>
                          <Input
                            id={`area-cep-${indice}`}
                            inputMode="numeric"
                            autoComplete="postal-code"
                            value={area.cep || ''}
                            placeholder="00000-000"
                            onChange={(event) => void preencherAreaPeloCep(indice, event.target.value)}
                          />
                          <p className="mt-1 text-xs text-muted-foreground">
                            Preenche cidade e UF
                          </p>
                        </div>
                        <div>
                          <Label htmlFor={`area-cidade-${indice}`}>Cidade atendida</Label>
                          <Input
                            id={`area-cidade-${indice}`}
                            value={area.cidade}
                            placeholder="Ex.: Gandu"
                            onChange={(event) => setFormData(prev => ({
                              ...prev,
                              areas_entrega: (prev.areas_entrega || []).map((item, atual) =>
                                atual === indice ? { ...item, cidade: event.target.value } : item,
                              ),
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`area-uf-${indice}`}>UF</Label>
                          <Input
                            id={`area-uf-${indice}`}
                            value={area.estado}
                            maxLength={2}
                            placeholder="BA"
                            onChange={(event) => setFormData(prev => ({
                              ...prev,
                              areas_entrega: (prev.areas_entrega || []).map((item, atual) =>
                                atual === indice
                                  ? {
                                      ...item,
                                      estado: event.target.value
                                        .replace(/[^a-z]/gi, '')
                                        .slice(0, 2)
                                        .toUpperCase(),
                                    }
                                  : item,
                              ),
                            }))}
                          />
                        </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="self-end"
                          onClick={() => setFormData(prev => ({
                            ...prev,
                            areas_entrega: (prev.areas_entrega || []).filter((_, atual) => atual !== indice),
                          }))}
                          aria-label="Remover área de entrega"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-3">
                        <Label htmlFor={`area-localidades-${indice}`}>
                          Bairros/localidades atendidos
                        </Label>
                        <Textarea
                          id={`area-localidades-${indice}`}
                          rows={4}
                          value={(area.localidades || []).join('\n')}
                          placeholder={"Centro\nBairro Novo\nZona Rural próxima"}
                          onChange={(event) => setFormData(prev => ({
                            ...prev,
                            areas_entrega: (prev.areas_entrega || []).map((item, atual) =>
                              atual === indice
                                ? {
                                    ...item,
                                    localidades: event.target.value
                                      .split(/\r?\n|,/)
                                      .map(valor => valor.trim())
                                      .filter(Boolean),
                                  }
                                : item,
                            ),
                          }))}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Uma localidade por linha. Deixe vazio para atender toda a cidade.
                        </p>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      areas_entrega: [
                        ...(prev.areas_entrega || []),
                        { cep: '', cidade: '', estado: '', localidades: [] },
                      ],
                    }))}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar cidade ou área próxima
                  </Button>

                  {(formData.areas_entrega || []).length === 0 && (
                    <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700">
                      Adicione pelo menos uma cidade antes de salvar. Com a restrição ativa e
                      nenhuma área cadastrada, entregas serão bloqueadas.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg-lg font-medium mb-4">Endereço do Estabelecimento</h3>
              <p className="text-sm text-gray-500 mb-4">
                Este endereço será exibido no footer em Contato e na opção de Retirada no Local
              </p>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="endereco_estabelecimento">Endereço</Label>
                  <Input
                    id="endereco_estabelecimento"
                    value={formData.endereco_estabelecimento || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco_estabelecimento: e.target.value }))}
                    placeholder="Av. Nélson Leite Leal, Nº 106"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="bairro_estabelecimento">Bairro</Label>
                    <Input
                      id="bairro_estabelecimento"
                      value={formData.bairro_estabelecimento || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, bairro_estabelecimento: e.target.value }))}
                      placeholder="Centro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cidade_estabelecimento">Cidade</Label>
                    <Input
                      id="cidade_estabelecimento"
                      value={formData.cidade_estabelecimento || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, cidade_estabelecimento: e.target.value }))}
                      placeholder="Gandu"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="estado_estabelecimento">Estado</Label>
                    <Input
                      id="estado_estabelecimento"
                      value={formData.estado_estabelecimento || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, estado_estabelecimento: e.target.value }))}
                      placeholder="BA"
                      maxLength={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cep_estabelecimento">CEP</Label>
                    <Input
                      id="cep_estabelecimento"
                      value={formData.cep_estabelecimento || ''}
                      onChange={(e) => void preencherEstabelecimentoPeloCep(e.target.value)}
                      placeholder="45450-000"
                      maxLength={9}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Configurações de Pagamento PIX
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="chave_pix">Chave PIX *</Label>
              <Input
                id="chave_pix"
                value={formData.chave_pix}
                onChange={(e) => setFormData(prev => ({ ...prev, chave_pix: e.target.value }))}
                placeholder="Digite sua chave PIX (CPF, CNPJ, email, telefone ou chave aleatória)"
              />
              <p className="text-sm text-gray-500 mt-1">
                Esta será a chave PIX exibida aos clientes para pagamento
              </p>
            </div>

            <div>
              <Label htmlFor="nome_recebedor_pix">Nome Completo do Recebedor *</Label>
              <Input
                id="nome_recebedor_pix"
                value={formData.nome_recebedor_pix}
                onChange={(e) => setFormData(prev => ({ ...prev, nome_recebedor_pix: e.target.value }))}
                placeholder="Ex: João Silva Santos"
              />
              <p className="text-sm text-gray-500 mt-1">
                Nome completo que aparecerá no QR Code PIX (máximo 25 caracteres)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cidade_recebedor_pix">Cidade *</Label>
                <Input
                  id="cidade_recebedor_pix"
                  value={formData.cidade_recebedor_pix}
                  onChange={(e) => setFormData(prev => ({ ...prev, cidade_recebedor_pix: e.target.value }))}
                  placeholder="Ex: São Paulo"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Cidade do recebedor (máximo 15 caracteres)
                </p>
              </div>
              
              <div>
                <Label htmlFor="cep_recebedor_pix">CEP</Label>
                <Input
                  id="cep_recebedor_pix"
                  value={formData.cep_recebedor_pix}
                  onChange={(e) => void preencherRecebedorPeloCep(e.target.value)}
                  placeholder="Ex: 12345-678"
                  maxLength={9}
                />
                <p className="text-sm text-gray-500 mt-1">
                  CEP do recebedor (opcional)
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="mensagem_pix">Mensagem de Pagamento PIX</Label>
              <Textarea
                id="mensagem_pix"
                value={formData.mensagem_pix}
                onChange={(e) => setFormData(prev => ({ ...prev, mensagem_pix: e.target.value }))}
                placeholder="Mensagem exibida aos clientes na tela de pagamento PIX"
                rows={3}
              />
              <p className="text-sm text-gray-500 mt-1">
                Esta mensagem aparecerá para os clientes quando gerarem o PIX
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2">🕒</span>
              Funcionamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="aberto">Estabelecimento Aberto</Label>
              <input
                id="aberto"
                type="checkbox"
                checked={formData.aberto}
                onChange={e => setFormData(prev => ({ ...prev, aberto: e.target.checked }))}
                className="ml-2"
              />
              <span className="ml-2 font-medium">{formData.aberto ? "Aberto" : "Fechado"}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="hora_abertura">Horário de Abertura (Geral)</Label>
                <Input
                  id="hora_abertura"
                  type="time"
                  value={formData.hora_abertura}
                  onChange={e => handleGeneralScheduleChange('hora_abertura', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="hora_fechamento">Horário de Fechamento (Geral)</Label>
                <Input
                  id="hora_fechamento"
                  type="time"
                  value={formData.hora_fechamento}
                  onChange={e => handleGeneralScheduleChange('hora_fechamento', e.target.value)}
                />
              </div>
            </div>
            
            <div className="hidden" aria-hidden="true">
              <h3 className="text-lg font-medium mb-4">Horários por Dia da Semana</h3>
              
              {/* Segunda-feira */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mb-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="aberto_segunda"
                    checked={formData.aberto_segunda}
                    onChange={e => setFormData(prev => ({ ...prev, aberto_segunda: e.target.checked }))}
                    className="mr-2"
                  />
                  <Label htmlFor="aberto_segunda">Segunda-feira</Label>
                </div>
                <div>
                  <Input
                    type="time"
                    value={formData.hora_abertura_segunda}
                    onChange={e => setFormData(prev => ({ ...prev, hora_abertura_segunda: e.target.value }))}
                    disabled={!formData.aberto_segunda}
                  />
                </div>
                <div className="text-center">até</div>
                <div>
                  <Input
                    type="time"
                    value={formData.hora_fechamento_segunda}
                    onChange={e => setFormData(prev => ({ ...prev, hora_fechamento_segunda: e.target.value }))}
                    disabled={!formData.aberto_segunda}
                  />
                </div>
              </div>
              
              {/* Terça-feira */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mb-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="aberto_terca"
                    checked={formData.aberto_terca}
                    onChange={e => setFormData(prev => ({ ...prev, aberto_terca: e.target.checked }))}
                    className="mr-2"
                  />
                  <Label htmlFor="aberto_terca">Terça-feira</Label>
                </div>
                <div>
                  <Input
                    type="time"
                    value={formData.hora_abertura_terca}
                    onChange={e => setFormData(prev => ({ ...prev, hora_abertura_terca: e.target.value }))}
                    disabled={!formData.aberto_terca}
                  />
                </div>
                <div className="text-center">até</div>
                <div>
                  <Input
                    type="time"
                    value={formData.hora_fechamento_terca}
                    onChange={e => setFormData(prev => ({ ...prev, hora_fechamento_terca: e.target.value }))}
                    disabled={!formData.aberto_terca}
                  />
                </div>
              </div>
              
              {/* Quarta-feira */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mb-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="aberto_quarta"
                    checked={formData.aberto_quarta}
                    onChange={e => setFormData(prev => ({ ...prev, aberto_quarta: e.target.checked }))}
                    className="mr-2"
                  />
                  <Label htmlFor="aberto_quarta">Quarta-feira</Label>
                </div>
                <div>
                  <Input
                    type="time"
                    value={formData.hora_abertura_quarta}
                    onChange={e => setFormData(prev => ({ ...prev, hora_abertura_quarta: e.target.value }))}
                    disabled={!formData.aberto_quarta}
                  />
                </div>
                <div className="text-center">até</div>
                <div>
                  <Input
                    type="time"
                    value={formData.hora_fechamento_quarta}
                    onChange={e => setFormData(prev => ({ ...prev, hora_fechamento_quarta: e.target.value }))}
                    disabled={!formData.aberto_quarta}
                  />
                </div>
              </div>
              
              {/* Quinta-feira */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mb-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="aberto_quinta"
                    checked={formData.aberto_quinta}
                    onChange={e => setFormData(prev => ({ ...prev, aberto_quinta: e.target.checked }))}
                    className="mr-2"
                  />
                  <Label htmlFor="aberto_quinta">Quinta-feira</Label>
                </div>
                <div>
                  <Input
                    type="time"
                    value={formData.hora_abertura_quinta}
                    onChange={e => setFormData(prev => ({ ...prev, hora_abertura_quinta: e.target.value }))}
                    disabled={!formData.aberto_quinta}
                  />
                </div>
                <div className="text-center">até</div>
                <div>
                  <Input
                    type="time"
                    value={formData.hora_fechamento_quinta}
                    onChange={e => setFormData(prev => ({ ...prev, hora_fechamento_quinta: e.target.value }))}
                    disabled={!formData.aberto_quinta}
                  />
                </div>
              </div>
              
              {/* Sexta-feira */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mb-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="aberto_sexta"
                    checked={formData.aberto_sexta}
                    onChange={e => setFormData(prev => ({ ...prev, aberto_sexta: e.target.checked }))}
                    className="mr-2"
                  />
                  <Label htmlFor="aberto_sexta">Sexta-feira</Label>
                </div>
                <div>
                  <Input
                    type="time"
                    value={formData.hora_abertura_sexta}
                    onChange={e => setFormData(prev => ({ ...prev, hora_abertura_sexta: e.target.value }))}
                    disabled={!formData.aberto_sexta}
                  />
                </div>
                <div className="text-center">até</div>
                <div>
                  <Input
                    type="time"
                    value={formData.hora_fechamento_sexta}
                    onChange={e => setFormData(prev => ({ ...prev, hora_fechamento_sexta: e.target.value }))}
                    disabled={!formData.aberto_sexta}
                  />
                </div>
              </div>
              
              {/* Sábado */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mb-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="aberto_sabado"
                    checked={formData.aberto_sabado}
                    onChange={e => setFormData(prev => ({ ...prev, aberto_sabado: e.target.checked }))}
                    className="mr-2"
                  />
                  <Label htmlFor="aberto_sabado">Sábado</Label>
                </div>
                <div>
                  <Input
                    type="time"
                    value={formData.hora_abertura_sabado}
                    onChange={e => setFormData(prev => ({ ...prev, hora_abertura_sabado: e.target.value }))}
                    disabled={!formData.aberto_sabado}
                  />
                </div>
                <div className="text-center">até</div>
                <div>
                  <Input
                    type="time"
                    value={formData.hora_fechamento_sabado}
                    onChange={e => setFormData(prev => ({ ...prev, hora_fechamento_sabado: e.target.value }))}
                    disabled={!formData.aberto_sabado}
                  />
                </div>
              </div>
              
              {/* Domingo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="aberto_domingo"
                    checked={formData.aberto_domingo}
                    onChange={e => setFormData(prev => ({ ...prev, aberto_domingo: e.target.checked }))}
                    className="mr-2"
                  />
                  <Label htmlFor="aberto_domingo">Domingo</Label>
                </div>
                <div>
                  <Input
                    type="time"
                    value={formData.hora_abertura_domingo}
                    onChange={e => setFormData(prev => ({ ...prev, hora_abertura_domingo: e.target.value }))}
                    disabled={!formData.aberto_domingo}
                  />
                </div>
                <div className="text-center">até</div>
                <div>
                  <Input
                    type="time"
                    value={formData.hora_fechamento_domingo}
                    onChange={e => setFormData(prev => ({ ...prev, hora_fechamento_domingo: e.target.value }))}
                    disabled={!formData.aberto_domingo}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default ManagerSettings;
