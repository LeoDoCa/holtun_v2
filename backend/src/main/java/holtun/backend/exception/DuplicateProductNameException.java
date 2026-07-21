package holtun.backend.exception;

public class DuplicateProductNameException extends RuntimeException {
    public DuplicateProductNameException(String message) {
        super(message);
    }
}