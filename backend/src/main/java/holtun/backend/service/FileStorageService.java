package holtun.backend.service;

import holtun.backend.exception.StoredFileNotFoundException;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Log4j2
public class FileStorageService {

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    public String saveFile(MultipartFile file, UUID entityUuid, String fileName) {
        try {
            if (file == null || file.isEmpty()) {
                throw new IllegalArgumentException("El archivo está vacío.");
            }

            String extension = getExtension(file.getOriginalFilename());
            Path directory = createDirectory(entityUuid);
            Path target = directory.resolve(fileName + extension);
            Files.copy(
                    file.getInputStream(),
                    target,
                    StandardCopyOption.REPLACE_EXISTING
            );

            String relativePath = "/uploads/" + entityUuid + "/" + fileName + extension;
            log.info("Archivo guardado: {}", relativePath);

            return relativePath;
        } catch (IOException e) {
            throw new RuntimeException("No se pudo guardar el archivo.", e);
        }
    }

    public List<String> saveFiles(MultipartFile[] files, UUID entityUuid) {
        List<String> paths = new ArrayList<>();

        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            if (file != null && !file.isEmpty()) {
                paths.add(saveFile(file, entityUuid, "image_" + (i + 1)));
            }
        }

        return paths;
    }

    public void deleteFile(String relativePath) {
        try {
            Path path = resolvePath(relativePath);
            Files.deleteIfExists(path);
            log.info("Archivo eliminado: {}", relativePath);
        } catch (IOException e) {
            throw new RuntimeException("No se pudo eliminar el archivo.", e);
        }
    }

    public void deleteEntityFiles(UUID entityUuid) {
        Path directory = Paths.get(uploadDir, entityUuid.toString());

        if (!Files.exists(directory)) {
            return;
        }
        try {
            Files.walk(directory)
                    .sorted((a, b) -> b.compareTo(a))
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                        } catch (IOException e) {
                            log.error("Error eliminando {}", path);
                        }
                    });
        } catch (IOException e) {
            throw new RuntimeException("No se pudieron eliminar los archivos.", e);
        }
    }

    public Path getFile(String relativePath) {
        Path path = resolvePath(relativePath);
        if (!Files.exists(path)) {
            log.error("Archivo no encontrado en ruta: {}", relativePath);
            throw new StoredFileNotFoundException("Archivo no encontrado.");
        }
        return path;
    }

    public boolean isImage(MultipartFile file) {
        String type = file.getContentType();
        return type != null &&
                (type.equals("image/jpeg")
                        || type.equals("image/png")
                        || type.equals("image/webp")
                        || type.equals("image/jpg"));

    }

    public boolean validateSize(MultipartFile file, int maxSizeMB) {
        long maxBytes = maxSizeMB * 1024L * 1024L;
        return file.getSize() <= maxBytes;
    }

    private Path createDirectory(UUID entityUuid) throws IOException {
        Path directory = Paths.get(uploadDir, entityUuid.toString());
        if (!Files.exists(directory)) {
            Files.createDirectories(directory);
        }
        return directory;
    }

    private Path resolvePath(String relativePath) {
        String path = relativePath.replace("/uploads/", "");
        return Paths.get(uploadDir, path);
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

}