import { Link } from "react-router-dom";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";
import { createWhatsAppConversationUrl } from "@/lib/whatsapp";

// Helper function to format business hours
const formatBusinessHours = (config: any) => {
  // If using default schedules, show general schedule for all days
  if (config.using_default_schedules) {
    const generalOpen = config.hora_abertura ? config.hora_abertura.substring(0, 5) : '08:00';
    const generalClose = config.hora_fechamento ? config.hora_fechamento.substring(0, 5) : '18:00';
    
    return [
      `Segunda-feira: ${generalOpen} às ${generalClose}`,
      `Terça-feira: ${generalOpen} às ${generalClose}`,
      `Quarta-feira: ${generalOpen} às ${generalClose}`,
      `Quinta-feira: ${generalOpen} às ${generalClose}`,
      `Sexta-feira: ${generalOpen} às ${generalClose}`,
      `Sábado: ${generalOpen} às ${generalClose}`,
      `Domingo: Fechado`
    ];
  }
  
  // Otherwise, show individual day schedules
  const days = [
    { key: 'segunda', name: 'Segunda-feira' },
    { key: 'terca', name: 'Terça-feira' },
    { key: 'quarta', name: 'Quarta-feira' },
    { key: 'quinta', name: 'Quinta-feira' },
    { key: 'sexta', name: 'Sexta-feira' },
    { key: 'sabado', name: 'Sábado' },
    { key: 'domingo', name: 'Domingo' }
  ];

  return days.map(day => {
    const isOpen = config[`aberto_${day.key}`];
    if (!isOpen) {
      return `${day.name}: Fechado`;
    }
    
    const openTime = config[`hora_abertura_${day.key}`];
    const closeTime = config[`hora_fechamento_${day.key}`];
    
    // Format time to remove seconds (HH:MM:SS -> HH:MM)
    const formatTime = (time: string) => {
      if (time && time.length >= 5) {
        return time.substring(0, 5);
      }
      return time;
    };
    
    return `${day.name}: ${formatTime(openTime)} às ${formatTime(closeTime)}`;
  });
};

export const Footer = () => {
  const { configuracao } = useEstabelecimento();
  
  // Use the platform name from configuration or default to "Plataforma"
  const platformName = configuracao?.nome_plataforma || "Plataforma";
  
  // Use WhatsApp and Instagram from configuration or defaults
  const whatsapp = configuracao?.whatsapp || "(73) 99811-2863";
  const whatsappUrl = createWhatsAppConversationUrl(whatsapp);
  const instagram = configuracao?.instagram || "aadr_modas";
  
  // Use establishment address from configuration or defaults
  const enderecoEstabelecimento = configuracao?.endereco_estabelecimento || "Av. Nélson Leite Leal, Nº 106";
  const cidadeEstabelecimento = configuracao?.cidade_estabelecimento || "Gandu";
  const estadoEstabelecimento = configuracao?.estado_estabelecimento || "BA";
  const cepEstabelecimento = configuracao?.cep_estabelecimento || "45450-000";

  // Format business hours
  const businessHours = configuracao ? formatBusinessHours(configuracao) : [
    'Segunda-feira: 8h às 18h',
    'Terça-feira: 8h às 18h',
    'Quarta-feira: 8h às 18h',
    'Quinta-feira: 8h às 18h',
    'Sexta-feira: 8h às 18h',
    'Sábado: 8h às 12h',
    'Domingo: Fechado'
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Sobre</h3>
            <p className="text-gray-400 text-sm">
              {configuracao?.descricao_plataforma || 'Faça seu pedido pelo nosso cardápio digital.'}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/" className="hover:text-white transition-colors">Início</Link></li>
              <li><Link to="/#produtos" className="hover:text-white transition-colors">Produtos</Link></li>
              <li><Link to="/#contato" className="hover:text-white transition-colors">Contato</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>WhatsApp: {whatsapp}</li>
              <li>Instagram: @{instagram}</li>
              <li>{enderecoEstabelecimento}</li>
              <li>{cidadeEstabelecimento}-{estadoEstabelecimento}{!enderecoEstabelecimento.toLowerCase().includes('cep') ? `, CEP: ${cepEstabelecimento}` : ''}</li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Horário de Funcionamento</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              {businessHours.map((hour, index) => (
                <li key={index}>{hour}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} {platformName}. Todos os direitos reservados.
          </p>
          <a
            href="https://vupi.us/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/15 px-4 text-sm text-gray-300 transition hover:border-white/40 hover:bg-white/10 hover:text-white md:mt-0"
          >
            Tecnologia <strong>vupi.us API</strong>
          </a>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white link-themed">
              <span className="sr-only">Instagram</span>
              <svg className="h-6 w-6 icon-themed" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
            {whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white link-themed">
              <span className="sr-only">WhatsApp</span>
              <svg className="h-6 w-6 icon-themed" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" clipRule="evenodd" />
              </svg>
            </a>}
          </div>
        </div>
      </div>
    </footer>
  );
};
