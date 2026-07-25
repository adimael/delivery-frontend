import { MainLayout } from "@/components/layout/MainLayout";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";

const Tutorial = () => {
  const { configuracao } = useEstabelecimento();
  
  // Use the platform name from configuration or default to "Plataforma"
  const platformName = configuracao?.nome_plataforma || "Plataforma";

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Tutorial: Como Construir a Plataforma {platformName}</h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Configuração Inicial do Projeto</h2>
            <div className="prose prose-slate">
              <p>Neste tutorial, vamos construir uma plataforma de delivery completa usando as seguintes tecnologias:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>React com TypeScript para a estrutura principal</li>
                <li>Tailwind CSS para estilização</li>
                <li>Shadcn UI para componentes prontos</li>
                <li>Zustand para gerenciamento de estado</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Estrutura do Projeto</h2>
            <div className="prose prose-slate">
              <p>Organize seu projeto com a seguinte estrutura de pastas:</p>
              <pre className="bg-gray-100 p-4 rounded-md">
{`src/
  ├── components/
  │   ├── common/       # Componentes compartilhados
  │   ├── layout/       # Layouts principais
  │   ├── products/     # Componentes relacionados a produtos
  │   └── ui/          # Componentes de UI reutilizáveis
  ├── hooks/           # Hooks personalizados
  ├── pages/          # Páginas da aplicação
  ├── stores/         # Estados globais (Zustand)
  └── lib/           # Utilitários e funções helpers`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Implementação dos Componentes Principais</h2>
            <div className="prose prose-slate space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">3.1 Layout Principal</h3>
                <p>O MainLayout é responsável pela estrutura básica de todas as páginas públicas:</p>
                <pre className="bg-gray-100 p-4 rounded-md">
{`// MainLayout.tsx
import { ReactNode } from "react";
import { MainNavbar } from "./MainNavbar";
import { Footer } from "./Footer";

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <MainNavbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};`}
                </pre>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">3.2 Navegação</h3>
                <p>A barra de navegação deve ser responsiva e incluir:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Logo da empresa</li>
                  <li>Menu de navegação</li>
                  <li>Carrinho de compras</li>
                  <li>Área do usuário</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Boas Práticas</h2>
            <div className="prose prose-slate">
              <h3 className="text-xl font-semibold mb-2">4.1 Componentização</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Mantenha componentes pequenos e focados em uma única responsabilidade</li>
                <li>Use TypeScript para tipagem forte e melhor manutenibilidade</li>
                <li>Implemente testes para componentes críticos</li>
                <li>Utilize PropTypes ou TypeScript interfaces para documentar props</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-2">4.2 Estilização</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use classes utilitárias do Tailwind para estilização rápida</li>
                <li>Mantenha consistência no design usando variáveis CSS</li>
                <li>Implemente design responsivo desde o início</li>
                <li>Considere acessibilidade em todos os componentes</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4 mb-2">4.3 Performance</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Utilize React.memo() para componentes que recebem props estáveis</li>
                <li>Implemente lazy loading para imagens e rotas</li>
                <li>Otimize o bundle size usando code splitting</li>
                <li>Use cache e memoização quando apropriado</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Implementação por Etapas</h2>
            <div className="space-y-4">
              <div className="border p-4 rounded-md">
                <h3 className="font-semibold mb-2">Etapa 1: Configuração do Ambiente</h3>
                <pre className="bg-gray-100 p-4 rounded-md">
{`# Instalação das dependências necessárias
npm create vite@latest meu-app -- --template react-ts
cd meu-app
npm install tailwindcss postcss autoprefixer
npm install @radix-ui/react-* shadcn-ui
npm install zustand`}
                </pre>
              </div>

              <div className="border p-4 rounded-md">
                <h3 className="font-semibold mb-2">Etapa 2: Configuração do Tailwind</h3>
                <pre className="bg-gray-100 p-4 rounded-md">
{`// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#F97316",
        // ... outras cores
      }
    }
  },
  plugins: []
}`}
                </pre>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Considerações Finais</h2>
            <div className="prose prose-slate">
              <p>Ao desenvolver sua plataforma, lembre-se de:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Manter a documentação atualizada</li>
                <li>Implementar feedback visual para ações do usuário</li>
                <li>Criar mensagens de erro amigáveis</li>
                <li>Testar em diferentes dispositivos e navegadores</li>
                <li>Seguir as melhores práticas de segurança</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default Tutorial;