// ============================================
// CÓDIGO CORREGIDO PARA ClienteServiceImpl.java
// ============================================
// 
// PROBLEMA ENCONTRADO:
// En el método actualizarCliente (línea ~147), la contraseña se asigna directamente
// sin encriptar:
// 
// ❌ CÓDIGO ACTUAL (INCORRECTO):
// if (clienteDto.getUsuario().getContrasena() != null && !clienteDto.getUsuario().getContrasena().isEmpty()) {
//     usuario.setContrasena(clienteDto.getUsuario().getContrasena());
// }
//
// ✅ SOLUCIÓN: Reemplazar con el código corregido abajo
// ============================================

package com.tec.usuarioac.serviceImpl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder; // ✅ IMPORTANTE: Asegúrate de tener este import
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.tec.usuarioac.dto.ClienteDto;
import com.tec.usuarioac.dto.RegistroClienteDto;
import com.tec.usuarioac.dto.UsuarioDto;
import com.tec.usuarioac.entity.Cliente;
import com.tec.usuarioac.entity.Usuario;
import com.tec.usuarioac.exception.ResourceNotFoundException;
import com.tec.usuarioac.mapper.ClienteMapper;
import com.tec.usuarioac.repository.ClienteRepository;
import com.tec.usuarioac.repository.UsuarioRepository;
import com.tec.usuarioac.service.ClienteService;
import com.tec.usuarioac.service.UsuarioService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ClienteServiceImpl implements ClienteService {

    private final ClienteRepository clienteRepository;
    private final UsuarioService usuarioService;
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder; // ✅ IMPORTANTE: Agregar PasswordEncoder aquí
    
    @Value("${app.upload.dir.clientes:/uploads/clientes}")
    private String uploadDir;

    // ... otros métodos existentes ...

    @Override
    @Transactional
    public ClienteDto actualizarCliente(Long id, ClienteDto clienteDto) {
        Cliente clienteExistente = clienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con id: " + id));
        
        // Actualizar campos del cliente
        if (clienteDto.getNombre() != null) {
            clienteExistente.setNombre(clienteDto.getNombre());
        }
        if (clienteDto.getApellidos() != null) {
            clienteExistente.setApellidos(clienteDto.getApellidos());
        }
        if (clienteDto.getTelefono() != null) {
            clienteExistente.setTelefono(clienteDto.getTelefono());
        }
        
        // Actualizar usuario si se proporciona
        if (clienteDto.getUsuario() != null) {
            Usuario usuario = clienteExistente.getUsuario();
            
            if (clienteDto.getUsuario().getCorreo() != null) {
                // Verificar si el nuevo correo ya existe (excepto el actual)
                if (!usuario.getCorreo().equals(clienteDto.getUsuario().getCorreo()) && 
                    usuarioService.existeUsuarioPorCorreo(clienteDto.getUsuario().getCorreo())) {
                    throw new IllegalArgumentException("El correo ya está en uso");
                }
                usuario.setCorreo(clienteDto.getUsuario().getCorreo());
            }
            
            // ✅ CÓDIGO CORREGIDO: Encriptar contraseña si se proporciona
            if (clienteDto.getUsuario().getContrasena() != null && 
                !clienteDto.getUsuario().getContrasena().isEmpty()) {
                
                String nuevaContrasena = clienteDto.getUsuario().getContrasena();
                
                // Solo encriptar si no está ya encriptada (no empieza con $2a$)
                // Esto es la misma lógica que se usa en UsuarioServiceImpl.guardarUsuario()
                if (!nuevaContrasena.startsWith("$2a$")) {
                    usuario.setContrasena(passwordEncoder.encode(nuevaContrasena));
                } else {
                    // Si ya está encriptada, usar directamente (por si acaso)
                    usuario.setContrasena(nuevaContrasena);
                }
            }
            
            usuarioRepository.save(usuario);
        }
        
        Cliente clienteActualizado = clienteRepository.save(clienteExistente);
        return ClienteMapper.mapToClienteDto(clienteActualizado);
    }

    // ... resto de los métodos existentes ...
}




