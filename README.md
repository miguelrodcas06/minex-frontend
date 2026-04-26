# MineX

Proyecto de MineX usando react para crear el front de la aplicación

## Enlace al repositorio de GitHub

[https://github.com/miguelrodcas06/minex-frontend](https://github.com/miguelrodcas06/minex-frontend)

## Base de datos

La aplicación usa **Supabase (PostgreSQL)** en producción. Configura la variable de entorno en el backend:

```
DATABASE_URL=postgresql://postgres.[proyecto]:[password]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```

## Ejecución del Proyecto

### Backend

1.  Navegar al directorio del backend:
    bash
    cd ../minex-backend
    
2.  Instalar dependencias:
    bash
    npm install
    
3.  Iniciar el servidor de desarrollo:
    bash
    npm run dev
    
### Frontend

1.  Navegar al directorio del frontend:
    bash
    cd ../minex-frontend
    
2.  Instalar dependencias:
    bash
    npm install
    
3.  Iniciar el servidor de desarrollo:
    bash
    npm run dev