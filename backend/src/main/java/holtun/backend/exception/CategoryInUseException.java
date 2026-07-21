package holtun.backend.exception;

public class CategoryInUseException extends RuntimeException {
    public CategoryInUseException(String message) {
        super(message);
    }
}