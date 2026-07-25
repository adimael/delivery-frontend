import { useEstabelecimento } from "@/hooks/useEstabelecimento";

export const ThemeDebugger = () => {
  const { configuracao } = useEstabelecimento();
  
  if (!configuracao) return null;
  
  return (
    <div className="fixed bottom-0 right-0 bg-black text-white p-4 text-xs z-50">
      <h3 className="font-bold mb-2">Theme Debugger</h3>
      <div>Nome: {configuracao.nome_plataforma}</div>
      <div>Primary: {configuracao.cor_primaria}</div>
      <div>Secondary: {configuracao.cor_secundaria}</div>
      <div>Navbar: {configuracao.cor_navbar}</div>
      <div>Footer: {configuracao.cor_footer}</div>
      <div>Section Header: {configuracao.cor_section_header}</div>
      <div>Section Produtos: {configuracao.cor_section_produtos}</div>
      <div>Section Comprar: {configuracao.cor_section_comprar}</div>
      <div>Section Contato: {configuracao.cor_section_contato}</div>
      <div>Buttons: {configuracao.cor_botoes}</div>
      <div>Icons: {configuracao.cor_icones}</div>
    </div>
  );
};