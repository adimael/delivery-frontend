import { Link } from "react-router-dom";
import { useEstabelecimento } from "@/hooks/useEstabelecimento";

interface LogoProps {
  variant?: "dark" | "light";
}

export const Logo = ({ variant = "dark" }: LogoProps) => {
  const { configuracao, loading } = useEstabelecimento();
  const textColor = variant === "light" ? "text-white" : "text-gray-900";
  
  // Don't render anything while loading to prevent flash of default content
  if (loading && !configuracao) {
    return <div className="w-32 h-10"></div>; // Placeholder with same dimensions
  }
  
  // Use the platform name from configuration or default to "Plataforma"
  const platformName = configuracao?.nome_plataforma || "Meu Delivery";
  
  // Check if there's a custom icon URL
  const iconUrl = configuracao?.url_icone_plataforma;
  
  // Split the platform name to highlight the first part with the button color
  const nameParts = platformName.split(' ');
  const firstPart = nameParts[0]; // This will be the first word
  const restOfName = nameParts.slice(1).join(' '); // Rest of the name
  
  return (
    <Link to="/" className="flex min-w-0 items-center">
      <div className="flex min-w-0 items-center">
        {iconUrl ? (
          // Use custom icon if available
          <img 
            src={iconUrl} 
            alt={platformName} 
            className="h-11 w-11 flex-none rounded-lg object-contain"
          />
        ) : (
          // Fallback to colored letter icon
          <div className="h-11 w-11 flex-none rounded-lg flex items-center justify-center" 
               style={{ backgroundColor: 'hsl(var(--button-primary-bg, 48 100% 50%))' }}>
            <span className="font-bold text-white text-xl">
              {firstPart.charAt(0)}
            </span>
          </div>
        )}
        <div className={`ml-2 truncate font-heading font-bold text-lg sm:text-xl ${textColor}`}>
          <span className="text-[hsl(var(--button-primary-bg, 48 100% 50%))]">{firstPart}</span> {restOfName}
        </div>
      </div>
    </Link>
  );
};
