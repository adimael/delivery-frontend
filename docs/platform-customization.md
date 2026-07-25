# Platform Customization

This document explains how to customize the platform name and colors in the ADR Modas system.

## Database Changes

The configuration table has been updated to include new fields for platform customization:

- `nome_plataforma`: The name of the platform (default: "ADR Modas")
- `cor_primaria`: The primary color in hex format (default: "#3b82f6")
- `cor_secundaria`: The secondary color in hex format (default: "#1e40af")

### MySQL

For MySQL databases, run the following SQL to add the new columns:

```sql
ALTER TABLE configuracao_estabelecimento 
ADD COLUMN IF NOT EXISTS nome_plataforma VARCHAR(255) DEFAULT 'ADR Modas' AFTER id,
ADD COLUMN IF NOT EXISTS cor_primaria VARCHAR(7) DEFAULT '#3b82f6' AFTER nome_plataforma,
ADD COLUMN IF NOT EXISTS cor_secundaria VARCHAR(7) DEFAULT '#1e40af' AFTER cor_primaria;
```

### Supabase

For Supabase databases, run the following SQL:

```sql
ALTER TABLE public.configuracao_estabelecimento 
ADD COLUMN IF NOT EXISTS nome_plataforma TEXT DEFAULT 'ADR Modas',
ADD COLUMN IF NOT EXISTS cor_primaria TEXT DEFAULT '#3b82f6',
ADD COLUMN IF NOT EXISTS cor_secundaria TEXT DEFAULT '#1e40af';
```

## Using the Customization Features

### Manager Settings Page

Managers can access the customization options through the dashboard settings page:

1. Navigate to Dashboard > Configurações
2. Find the "Personalização da Plataforma" section
3. Edit the platform name and colors as needed
4. Click "Salvar Configurações"

### Theme Application

The theme is automatically applied throughout the application using CSS variables. The system converts hex colors to HSL format for better CSS integration.

## Default Values

If no customization is set, the platform will use these default values:

- Platform Name: "ADR Modas"
- Primary Color: #3b82f6 (blue)
- Secondary Color: #1e40af (dark blue)

## Implementation Details

The theme is applied in the main App component using the `useEstabelecimento` hook and the `applyPlatformTheme` utility function. The theme updates automatically when the configuration changes.