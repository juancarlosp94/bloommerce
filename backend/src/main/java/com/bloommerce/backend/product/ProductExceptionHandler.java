
package com.bloommerce.backend.product;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice(assignableTypes = ProductController.class)
public class ProductExceptionHandler
    extends ResponseEntityExceptionHandler {


    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
        MethodArgumentNotValidException ex,
        HttpHeaders headers,
        HttpStatusCode status,
        WebRequest request
    ) {
        Map<String, String> errors = new LinkedHashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(error ->
            errors.putIfAbsent(
                error.getField(),
                error.getDefaultMessage() != null
                    ? error.getDefaultMessage()
                    : "Invalid value"
            )
        );

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("title", "Validation failed");
        response.put("status", 400);
        response.put(
            "detail",
            "One or more product fields are invalid"
        );
        response.put("errors", errors);

        return ResponseEntity
            .badRequest()
            .body(response);
    }


    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ProblemDetail> handleDataIntegrity(
        DataIntegrityViolationException ex
    ) {
        if (isUniqueViolation(ex)) {
            ProblemDetail problem = ProblemDetail.forStatus(
                HttpStatus.CONFLICT
            );

            problem.setTitle("Resource conflict");
            problem.setDetail(
                "A resource with this unique value already exists"
            );

            return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(problem);
        }

        // Other database constraint violations are not necessarily
        // duplicate SKUs. Do not misreport them as HTTP 409.
        throw ex;
    }

    private boolean isUniqueViolation(Throwable exception) {
        Throwable cause = exception;

        while (cause != null) {
            if (cause instanceof SQLException sqlException
                && "23505".equals(sqlException.getSQLState())) {
                return true;
            }

            cause = cause.getCause();
        }

        return false;
    }
}
