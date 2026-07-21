package holtun.backend.exception;

public class InvalidCategoryException extends RuntimeException {
    public InvalidCategoryException(String message) {
        super(message);
    }
}