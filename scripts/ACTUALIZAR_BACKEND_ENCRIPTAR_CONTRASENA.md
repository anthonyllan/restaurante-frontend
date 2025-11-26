# Instrucciones para Encriptar Contraseña al Actualizar Perfil

## Problema
Cuando se actualiza el perfil (cliente o empleado) y se cambia la contraseña, esta no se encripta automáticamente, quedando en texto plano en la base de datos.

## Solución
Reutilizar la misma lógica de encriptación que se usa en el registro.

## Pasos a Seguir

### 1. Ubicar el método de encriptación en el registro

Busca en `UsuarioServiceImpl.java` el método que encripta la contraseña durante el registro. Debería verse algo así:

```java
// En el método de registro (guardarUsuario o similar)
if (usuario.getContrasena() != null && !usuario.getContrasena().startsWith("$2a$")) {
    usuario.setContrasena(passwordEncoder.encode(usuario.getContrasena()));
}
```

### 2. Aplicar la misma lógica en ClienteServiceImpl

En `ClienteServiceImpl.java`, busca el método `actualizarCliente` o `actualizarPerfilCliente` y agrega la misma verificación:

```java
@Override
public ClienteDto actualizarCliente(Long id, ClienteDto clienteDto) {
    Cliente cliente = clienteRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado"));
    
    // Actualizar campos básicos
    cliente.setNombre(clienteDto.getNombre());
    cliente.setApellidos(clienteDto.getApellidos());
    cliente.setTelefono(clienteDto.getTelefono());
    
    // Si se actualiza el usuario (correo o contraseña)
    if (clienteDto.getUsuario() != null) {
        Usuario usuario = cliente.getUsuario();
        
        if (clienteDto.getUsuario().getCorreo() != null) {
            usuario.setCorreo(clienteDto.getUsuario().getCorreo());
        }
        
        // ✅ AGREGAR ESTA LÓGICA: Encriptar contraseña si se proporciona y no está ya encriptada
        if (clienteDto.getUsuario().getContrasena() != null && 
            !clienteDto.getUsuario().getContrasena().isEmpty()) {
            
            String nuevaContrasena = clienteDto.getUsuario().getContrasena();
            
            // Solo encriptar si no está ya encriptada (no empieza con $2a$)
            if (!nuevaContrasena.startsWith("$2a$")) {
                usuario.setContrasena(passwordEncoder.encode(nuevaContrasena));
            } else {
                // Si ya está encriptada, usar directamente (por si acaso)
                usuario.setContrasena(nuevaContrasena);
            }
        }
    }
    
    Cliente clienteActualizado = clienteRepository.save(cliente);
    return ClienteMapper.mapToClienteDto(clienteActualizado);
}
```

### 3. Aplicar la misma lógica en EmpleadoServiceImpl

En `EmpleadoServiceImpl.java`, busca el método `actualizarEmpleado` o `actualizarPerfilEmpleado` y agrega la misma verificación:

```java
@Override
public EmpleadoDto actualizarEmpleado(Long id, EmpleadoDto empleadoDto) {
    Empleado empleado = empleadoRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Empleado no encontrado"));
    
    // Actualizar campos básicos
    empleado.setNombre(empleadoDto.getNombre());
    empleado.setApellidos(empleadoDto.getApellidos());
    empleado.setTelefono(empleadoDto.getTelefono());
    
    // Si se actualiza el usuario (correo o contraseña)
    if (empleadoDto.getUsuario() != null) {
        Usuario usuario = empleado.getUsuario();
        
        if (empleadoDto.getUsuario().getCorreo() != null) {
            usuario.setCorreo(empleadoDto.getUsuario().getCorreo());
        }
        
        // ✅ AGREGAR ESTA LÓGICA: Encriptar contraseña si se proporciona y no está ya encriptada
        if (empleadoDto.getUsuario().getContrasena() != null && 
            !empleadoDto.getUsuario().getContrasena().isEmpty()) {
            
            String nuevaContrasena = empleadoDto.getUsuario().getContrasena();
            
            // Solo encriptar si no está ya encriptada (no empieza con $2a$)
            if (!nuevaContrasena.startsWith("$2a$")) {
                usuario.setContrasena(passwordEncoder.encode(nuevaContrasena));
            } else {
                // Si ya está encriptada, usar directamente (por si acaso)
                usuario.setContrasena(nuevaContrasena);
            }
        }
    }
    
    Empleado empleadoActualizado = empleadoRepository.save(empleado);
    return EmpleadoMapper.mapToEmpleadoDto(empleadoActualizado);
}
```

### 4. Verificar que PasswordEncoder esté inyectado

Asegúrate de que en ambos servicios (`ClienteServiceImpl` y `EmpleadoServiceImpl`) tengas inyectado el `PasswordEncoder`:

```java
@Service
@RequiredArgsConstructor
public class ClienteServiceImpl implements ClienteService {
    
    private final ClienteRepository clienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder; // ✅ Asegúrate de tener esto
    
    // ... resto del código
}
```

Si usas `@RequiredArgsConstructor` de Lombok, asegúrate de que `PasswordEncoder` esté declarado como `final` en el constructor o inyectado con `@Autowired`.

### 5. Probar la funcionalidad

1. Inicia sesión con un usuario de prueba
2. Ve al módulo de perfil
3. Cambia la contraseña
4. Guarda los cambios
5. Verifica en la base de datos que la contraseña esté encriptada:

```sql
SELECT id, correo, LEFT(contrasena, 20) as hash_inicio FROM usuario WHERE correo = 'tu_correo@ejemplo.com';
```

La contraseña debería empezar con `$2a$10$`.

## Nota Importante

La verificación `!nuevaContrasena.startsWith("$2a$")` es importante porque:
- Si la contraseña ya está encriptada (empieza con `$2a$`), no la vuelve a encriptar
- Si está en texto plano, la encripta automáticamente
- Esto previene doble encriptación y permite flexibilidad




