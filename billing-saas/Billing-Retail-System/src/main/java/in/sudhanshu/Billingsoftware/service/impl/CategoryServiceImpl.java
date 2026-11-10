package in.sudhanshu.Billingsoftware.service.impl;

import in.sudhanshu.Billingsoftware.entity.CategoryEntity;
import in.sudhanshu.Billingsoftware.io.CategoryRequest;
import in.sudhanshu.Billingsoftware.io.CategoryResponse;
import in.sudhanshu.Billingsoftware.repository.CategoryRepository;
import in.sudhanshu.Billingsoftware.repository.ItemRepository;
import in.sudhanshu.Billingsoftware.service.CategoryService;
import in.sudhanshu.Billingsoftware.service.FileUploadService;
import in.sudhanshu.Billingsoftware.util.SecureUploadUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final FileUploadService fileUploadService;
    private final ItemRepository itemRepository;

    public CategoryResponse add(CategoryRequest request, MultipartFile file) throws IOException {
        //String imgUrl = fileUploadService.uploadFile(file);
        String ext = SecureUploadUtil.safeExtension(file.getOriginalFilename());
        String fileName = SecureUploadUtil.newStoredFileName("category", ext);
        Path uploadPath = Paths.get("uploads").toAbsolutePath().normalize();
        SecureUploadUtil.writeUpload(uploadPath, file, fileName);
        String imgUrl = "http://localhost:8080/uploads/" + fileName;
        CategoryEntity newCategory = convertToEntity(request);
        newCategory.setImgUrl(imgUrl);
        newCategory = categoryRepository.save(newCategory);
        return convertToResponse(newCategory);
    }

    @Override
    public List<CategoryResponse> read() {
        return categoryRepository.findAll()
                .stream()
                .map(categoryEntity -> convertToResponse(categoryEntity))
                .collect(Collectors.toList());
    }

    @Override
    public void delete(String categoryId) {
        CategoryEntity existingCategory = categoryRepository.findByCategoryId(categoryId)
                .orElseThrow(() -> new RuntimeException("Category not found: "+categoryId));
        //fileUploadService.deleteFile(existingCategory.getImgUrl());
        String imgUrl = existingCategory.getImgUrl();
        String fileName = imgUrl.substring(imgUrl.lastIndexOf("/") + 1);
        Path uploadPath = Paths.get("uploads").toAbsolutePath().normalize();
        try {
            Path filePath = SecureUploadUtil.resolveUnderRoot(uploadPath, fileName);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            e.printStackTrace();
        }
        categoryRepository.delete(existingCategory);
    }

    private CategoryResponse convertToResponse(CategoryEntity newCategory) {
        //Integer itemsCount = itemRepository.countByCategoryId(newCategory.getId());
//        return CategoryResponse.builder()
//                .categoryId(newCategory.getCategoryId())
//                .name(newCategory.getName())
//                .description(newCategory.getDescription())
//                .bgColor(newCategory.getBgColor())
//                .imgUrl(newCategory.getImgUrl())
//                .createdAt(newCategory.getCreatedAt())
//                .updatedAt(newCategory.getUpdatedAt())
//                .items(itemsCount)
//                .build();
        return null;
    }

    private CategoryEntity convertToEntity(CategoryRequest request) {
        return CategoryEntity.builder()
                .categoryId(UUID.randomUUID().toString())
                .name(request.getName())
                .description(request.getDescription())
                .bgColor(request.getBgColor())
                .build();
    }
}
