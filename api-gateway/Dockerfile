FROM nginx:1.25-alpine

# Copiar configuraciones personalizadas
COPY default.conf /etc/nginx/conf.d/default.conf
COPY proxy_params /etc/nginx/conf.d/proxy_params

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]