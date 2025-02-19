# Usa la última versión de Node.js como imagen base
FROM node:latest
# Establece el directorio de trabajo dentro del contenedor
WORKDIR /usr/src/app
# Copia solo package.json y package-lock.json para aprovechar el caché de Docker
COPY package*.json ./
# Instala las dependencias dentro del contenedor
RUN npm install
# Copia el resto del código de la aplicación
COPY . .
# Expone el puerto en el que la aplicación se ejecutará
EXPOSE 3000
# Comando para ejecutar la aplicación
CMD ["node", "app.js"]
