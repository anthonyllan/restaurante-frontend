# Corrección Rápida: Encriptar Contraseña al Actualizar Perfil

## Problema Identificado

En `ClienteServiceImpl.java`, método `actualizarCliente` (línea ~147), la contraseña se está asignando directamente sin encriptar:

```java
// ❌ CÓDIGO ACTUAL (INCORRECTO):
if (clienteDto.getUsuario().getContrasena() != null && !clienteDto.getUsuario().getContrasena().isEmpty()) {
    usuario.setContrasena(clienteDto.getUsuario().getContrasena()); // ❌ Sin encriptar
}
```

## Solución

### Paso 1: Verificar que PasswordEncoder esté inyectado

Asegúrate de que `ClienteServiceImpl` tenga `PasswordEncoder` como dependencia:

```java
@Service
@RequiredArgsConstructor
public class ClienteServiceImpl implements ClienteService {
    
    private final ClienteRepository clienteRepository;
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder; // ✅ Agregar esta línea si no existe
    
    // ... resto del código
}
```

Y el import:
```java
import org.springframework.security.crypto.password.PasswordEncoder;
```

### Paso 2: Reemplazar el código de actualización de contraseña

**Busca esta sección en `actualizarCliente`:**

```java
if (clienteDto.getUsuario().getContrasena() != null && !clienteDto.getUsuario().getContrasena().isEmpty()) {
    usuario.setContrasena(clienteDto.getUsuario().getContrasena());
}
```

**Reemplázala con:**

```java
// ✅ CÓDIGO CORREGIDO: Encriptar contraseña si se proporciona
if (clienteDto.getUsuario().getContrasena() != null && 
    !clienteDto.getUsuario().getContrasena().isEmpty()) {
    
    String nuevaContrasena = clienteDto.getUsuario().getContrasena();
    
    // Solo encriptar si no está ya encriptada (no empieza con $2a$)
    // Esta es la misma lógica que se usa en UsuarioServiceImpl.guardarUsuario()
    if (!nuevaContrasena.startsWith("$2a$")) {
        usuario.setContrasena(passwordEncoder.encode(nuevaContrasena));
    } else {
        // Si ya está encriptada, usar directamente (por si acaso)
        usuario.setContrasena(nuevaContrasena);
    }
}
```

### Paso 3: Aplicar lo mismo en EmpleadoServiceImpl

Si tienes un método similar en `EmpleadoServiceImpl.actualizarEmpleado`, aplica la misma corrección.

## Verificación

Después de aplicar los cambios:

1. Recompila el backend
2. Edita un perfil y cambia la contraseña
3. Verifica en la base de datos:

```sql
SELECT id, correo, LEFT(contrasena, 20) as hash_inicio 
FROM usuario 
WHERE correo = 'tu_correo@ejemplo.com';
```

La contraseña debería empezar con `$2a$10$` (encriptada).

## Nota

La verificación `!nuevaContrasena.startsWith("$2a$")` es importante porque:
- Si la contraseña ya está encriptada, no la vuelve a encriptar (evita doble encriptación)
- Si está en texto plano, la encripta automáticamente
- Es la misma lógica que se usa en `UsuarioServiceImpl.guardarUsuario()`



