export const getUserDataFromToken = () => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;

  try {
    // 1. Un JWT tiene la estructura: Header.Payload.Signature
    const base64Url = token.split('.')[1]; 
    
    // 2. Reemplazamos caracteres específicos de Base64URL a Base64 estándar
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // 3. Decodificamos el Base64 y manejamos caracteres especiales (acentos, ñ)
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload); // Retorna { user_id, role, full_name, exp, ... }
  } catch (error) {
    console.error("Error decodificando el token:", error);
    return null;
  }
};