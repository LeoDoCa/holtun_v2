package holtun.backend.utils;

import lombok.Data;
import org.springframework.http.HttpStatus;

@Data
public class ApiResponse {
    private String message;
    private Object data;
    private boolean error;
    private int statusCode;

    public ApiResponse(String message, HttpStatus statusCode) {
        this.message = message;
        this.statusCode = statusCode.value();
    }

    public ApiResponse(String message, Object data, HttpStatus statusCode) {
        this.message = message;
        this.data = data;
        this.statusCode = statusCode.value();
    }

    public ApiResponse(String message, boolean error, HttpStatus statusCode) {
        this.message = message;
        this.error = error;
        this.statusCode = statusCode.value();
    }
}
