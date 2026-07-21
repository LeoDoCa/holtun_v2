package holtun.backend.controller;

import holtun.backend.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.file.Path;
import java.util.UUID;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = {"*"})
@RequiredArgsConstructor
@Log4j2
public class FileController {

    private final FileStorageService fileStorageService;

    @GetMapping("/{entityUuid}/{filename}")
    public ResponseEntity<Resource> getFile(
            @PathVariable UUID entityUuid,
            @PathVariable String filename) {

        log.info("Solicitando archivo {} para entidad UUID: {}", filename, entityUuid);

        Path filePath = fileStorageService.getFile("/uploads/" + entityUuid + "/" + filename);
        Resource resource = new FileSystemResource(filePath);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(resolveContentType(filename)))
                .body(resource);
    }

    private String resolveContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }
}