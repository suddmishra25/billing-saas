package in.sudhanshu.Billingsoftware.util;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

public final class SecureUploadUtil {

    public static final long MAX_IMAGE_BYTES = 5L * 1024 * 1024;

    private static final Set<String> ALLOWED_EXTENSIONS =
            Set.of(".png", ".jpg", ".jpeg", ".webp", ".gif");

    private SecureUploadUtil() {}

    public static void validateImageUpload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is required");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new RuntimeException("Image must be 5 MB or smaller");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new RuntimeException("Only image uploads are allowed");
        }
        safeExtension(file.getOriginalFilename());
    }

    public static String safeExtension(String originalFilename) {
        String ext = ".png";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = originalFilename.substring(originalFilename.lastIndexOf('.')).toLowerCase(Locale.ROOT);
        }
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new RuntimeException("Allowed types: PNG, JPEG, WebP, GIF");
        }
        return ext;
    }

    public static String newStoredFileName(String prefix, String ext) {
        String safePrefix = prefix.replaceAll("[^a-zA-Z0-9\\-]", "");
        if (safePrefix.isEmpty()) {
            safePrefix = "upload";
        }
        return safePrefix + "-" + UUID.randomUUID() + ext;
    }

    public static Path resolveUnderRoot(Path uploadRoot, String fileName) throws IOException {
        if (fileName == null
                || fileName.contains("..")
                || fileName.contains("/")
                || fileName.contains("\\")) {
            throw new RuntimeException("Invalid file name");
        }
        Path normalizedRoot = uploadRoot.toAbsolutePath().normalize();
        Path target = normalizedRoot.resolve(fileName).normalize();
        if (!target.startsWith(normalizedRoot)) {
            throw new RuntimeException("Invalid file path");
        }
        return target;
    }

    public static void writeUpload(Path uploadRoot, MultipartFile file, String fileName) throws IOException {
        validateImageUpload(file);
        Files.createDirectories(uploadRoot);
        Path target = resolveUnderRoot(uploadRoot, fileName);
        Files.copy(file.getInputStream(), target);
    }
}
