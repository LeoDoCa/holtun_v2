package holtun.backend.config;

import holtun.backend.controller.UserController;
import holtun.backend.exception.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.ConstraintViolationException;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotAcceptableException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MultipartException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.sql.SQLException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeoutException;

@RestControllerAdvice
public class ErrorsController {

    private static final Logger log = LogManager.getLogger(UserController.class);


    @ExceptionHandler(EntityNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<Map<String, Object>> handleNotFoundException(EntityNotFoundException ex) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, "No se ha encontrado el recurso de tu petición, inténtalo nuevamente.", "E01");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleBadRequest(MethodArgumentTypeMismatchException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Tú solicitud es incorrecta, inténtalo nuevamente.", "E02");
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Error interno del sistema, vuelve a intentarlo.", "E03");
    }

    @ExceptionHandler(SQLException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Map<String, Object>> handleDatabaseException(SQLException ex) {
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Ocurrió un error en la base de datos, por favor vuelve a intentarlo.", "E04");
    }

    @ExceptionHandler(NoResourceFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<Map<String, Object>> handleNoResourceFoundException(NoResourceFoundException ex) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, "La URL que ingresaste no existe, por favor vuelve a intentarlo.", "E05");
    }

    @ExceptionHandler(HttpMediaTypeNotAcceptableException.class)
    @ResponseStatus(HttpStatus.NOT_ACCEPTABLE)
    public ResponseEntity<Map<String, Object>> handleNotAcceptableException(HttpMediaTypeNotAcceptableException ex) {
        return ResponseEntity
                .status(HttpStatus.NOT_ACCEPTABLE)
                .contentType(MediaType.APPLICATION_JSON)
                .body(buildErrorResponse(HttpStatus.NOT_ACCEPTABLE,
                        "El formato de tu respuesta no es soportado por el sistema, vuelve a intentarlo.",
                        "E06").getBody());
    }

    @ExceptionHandler(SecurityException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public ResponseEntity<Map<String, Object>> handleForbiddenException(SecurityException ex) {
        return buildErrorResponse(HttpStatus.FORBIDDEN, "Acceso no autorizado, vuelve a intentarlo.", "E07");
    }

    @ExceptionHandler(IllegalAccessException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ResponseEntity<Map<String, Object>> handleUnauthorizedException(IllegalAccessException ex) {
        return buildErrorResponse(HttpStatus.UNAUTHORIZED, "Al parecer no estás autorizado, inténtalo nuevamente.", "E08");
    }

    @ExceptionHandler(NullPointerException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Map<String, Object>> handleNullPointerException(NullPointerException ex) {
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Se produjo un error al procesar la solicitud. Un valor inesperado es nulo.", "E09");
    }

    @ExceptionHandler(IndexOutOfBoundsException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleIndexOutOfBoundsException(IndexOutOfBoundsException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "El índice solicitado está fuera del rango permitido.", "E10");
    }

    @ExceptionHandler(NumberFormatException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleNumberFormatException(NumberFormatException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "El formato del número ingresado no es válido.", "E11");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    @ResponseStatus(HttpStatus.METHOD_NOT_ALLOWED)
    public ResponseEntity<Map<String, Object>> handleMethodNotAllowedException(HttpRequestMethodNotSupportedException ex) {
        return buildErrorResponse(HttpStatus.METHOD_NOT_ALLOWED, "El método HTTP utilizado no está permitido para esta operación. Inténtalo nuevamente.", "E12");
    }

    @ExceptionHandler(ConstraintViolationException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleConstraintViolationException(ConstraintViolationException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Se ha violado una restricción de datos. Verifica tu solicitud.", "E13");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(java.util.stream.Collectors.joining(" | "));

        return buildErrorResponse(HttpStatus.BAD_REQUEST, errors, "E14");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleMissingServletRequestParameterException(MissingServletRequestParameterException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Falta un parámetro en la solicitud. Inténtalo nuevamente.", "E15");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleIllegalArgumentException(IllegalArgumentException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Se ha ingresado un argumento inválido.", "E16");
    }

    @ExceptionHandler(UnsupportedOperationException.class)
    @ResponseStatus(HttpStatus.NOT_IMPLEMENTED)
    public ResponseEntity<Map<String, Object>> handleUnsupportedOperationException(UnsupportedOperationException ex) {
        return buildErrorResponse(HttpStatus.NOT_IMPLEMENTED, "La operación solicitada no es soportada por el sistema.", "E17");
    }

    @ExceptionHandler(StackOverflowError.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Map<String, Object>> handleStackOverflowError(StackOverflowError ex) {
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Se detectó una recursión infinita o un uso excesivo de la memoria.", "E18");
    }

    @ExceptionHandler(TimeoutException.class)
    @ResponseStatus(HttpStatus.REQUEST_TIMEOUT)
    public ResponseEntity<Map<String, Object>> handleTimeoutException(TimeoutException ex) {
        return buildErrorResponse(HttpStatus.REQUEST_TIMEOUT, "La operación tardó demasiado en responder.", "E19");
    }

    @ExceptionHandler(ArithmeticException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleArithmeticException(ArithmeticException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Error matemático en la operación solicitada.", "E20");
    }

    @ExceptionHandler(FileNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<Map<String, Object>> handleFileNotFoundException(FileNotFoundException ex) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, "El archivo solicitado no se encontró en el servidor.", "E21");
    }

    @ExceptionHandler(IOException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Map<String, Object>> handleIOException(IOException ex) {
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Error de entrada/salida. Vuelve a intentarlo.", "E22");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadableException(HttpMessageNotReadableException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Error en el formato de la solicitud. Verifica el contenido enviado.", "E23");
    }

    @ExceptionHandler(MultipartException.class)
    public ResponseEntity<Map<String, Object>> handleMultipartException(MultipartException ex) {
        Throwable root = ex;
        while (root.getCause() != null) root = root.getCause();

        log.error("MultipartException causa raíz: {} - {}",
                root.getClass().getName(), root.getMessage());

        return buildErrorResponse(HttpStatus.BAD_REQUEST,
                root.getClass().getSimpleName() + ": " + root.getMessage(), "E24");
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleMissingPartException(MissingServletRequestPartException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST,
                "Falta el archivo requerido: " + ex.getRequestPartName(),
                "E25");
    }

    @ExceptionHandler(ProductNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<Map<String, Object>> handleProductNotFoundException(ProductNotFoundException ex) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), "E26");
    }

    @ExceptionHandler(CategoryNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<Map<String, Object>> handleCategoryNotFoundException(CategoryNotFoundException ex) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), "E27");
    }

    @ExceptionHandler(DuplicateProductNameException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<Map<String, Object>> handleDuplicateProductNameException(DuplicateProductNameException ex) {
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), "E28");
    }

    @ExceptionHandler(DuplicateCategoryNameException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<Map<String, Object>> handleDuplicateCategoryNameException(DuplicateCategoryNameException ex) {
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), "E29");
    }

    @ExceptionHandler(InvalidCategoryException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ResponseEntity<Map<String, Object>> handleInvalidCategoryException(InvalidCategoryException ex) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage(), "E30");
    }

    @ExceptionHandler(UserNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<Map<String, Object>> handleUserNotFoundException(UserNotFoundException ex) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), "E31");
    }

    @ExceptionHandler(DuplicateUsernameException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<Map<String, Object>> handleDuplicateUsernameException(DuplicateUsernameException ex) {
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), "E32");
    }

    @ExceptionHandler(RoleNotFoundException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ResponseEntity<Map<String, Object>> handleRoleNotFoundException(RoleNotFoundException ex) {
        log.error("Error de configuración: {}", ex.getMessage());
        return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error de configuración del sistema. Contacta al administrador.", "E33");
    }

    @ExceptionHandler(StoredFileNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ResponseEntity<Map<String, Object>> handleStoredFileNotFoundException(StoredFileNotFoundException ex) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage(), "E34");
    }

    @ExceptionHandler(CategoryInUseException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    public ResponseEntity<Map<String, Object>> handleCategoryInUseException(CategoryInUseException ex) {
        return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage(), "E35");
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(HttpStatus status, String message, String code) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("Estado", status.value());
        errorResponse.put("Mensaje", message);
        errorResponse.put("Código", code);
        return new ResponseEntity<>(errorResponse, status);
    }

}
