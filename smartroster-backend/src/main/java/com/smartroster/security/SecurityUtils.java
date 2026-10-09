package com.smartroster.security;

import javax.crypto.Mac;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.Base64;
import java.util.HexFormat;

public class SecurityUtils {

    private static final String SECRET = "SmartRoster_Secret_Key_For_Token_Signing_2026_Secure_HMAC";
    private static final int ITERATIONS = 10000;
    private static final int KEY_LENGTH = 256;
    private static final SecureRandom RANDOM = new SecureRandom();

    public static class TokenPayload {
        private final Long userId;
        private final String username;
        private final String role;
        private final long expiresAt;

        public TokenPayload(Long userId, String username, String role, long expiresAt) {
            this.userId = userId;
            this.username = username;
            this.role = role;
            this.expiresAt = expiresAt;
        }

        public Long getUserId() { return userId; }
        public String getUsername() { return username; }
        public String getRole() { return role; }
        public long getExpiresAt() { return expiresAt; }
        public boolean isExpired() { return System.currentTimeMillis() > expiresAt; }
    }

    public static String hashPassword(String password) {
        if (password == null) password = "";
        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);
        byte[] hash = pbkdf2(password.toCharArray(), salt, ITERATIONS, KEY_LENGTH);
        return HexFormat.of().formatHex(salt) + ":" + HexFormat.of().formatHex(hash);
    }

    public static boolean verifyPassword(String password, String storedHash) {
        if (password == null || storedHash == null) return false;
        String[] parts = storedHash.split(":");
        if (parts.length != 2) return false;
        try {
            byte[] salt = HexFormat.of().parseHex(parts[0]);
            byte[] expectedHash = HexFormat.of().parseHex(parts[1]);
            byte[] actualHash = pbkdf2(password.toCharArray(), salt, ITERATIONS, KEY_LENGTH);
            return MessageDigest.isEqual(expectedHash, actualHash);
        } catch (Exception e) {
            return false;
        }
    }

    private static byte[] pbkdf2(char[] password, byte[] salt, int iterations, int keyLength) {
        try {
            PBEKeySpec spec = new PBEKeySpec(password, salt, iterations, keyLength);
            SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            return skf.generateSecret(spec).getEncoded();
        } catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
            throw new RuntimeException("PBKDF2 algorithm not available", e);
        }
    }

    public static String generateToken(Long userId, String username, String role) {
        long now = System.currentTimeMillis();
        long expiry = now + (7L * 24 * 3600 * 1000); // 7 days validity
        String rawPayload = userId + ":" + username + ":" + role + ":" + expiry;
        String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(rawPayload.getBytes(StandardCharsets.UTF_8));
        String signature = sign(encodedPayload);
        return encodedPayload + "." + signature;
    }

    public static TokenPayload verifyToken(String token) {
        if (token == null || !token.contains(".")) return null;
        String[] parts = token.split("\\.");
        if (parts.length != 2) return null;

        String encodedPayload = parts[0];
        String signature = parts[1];

        if (!MessageDigest.isEqual(sign(encodedPayload).getBytes(StandardCharsets.UTF_8), signature.getBytes(StandardCharsets.UTF_8))) {
            return null; // Invalid signature
        }

        try {
            String rawPayload = new String(Base64.getUrlDecoder().decode(encodedPayload), StandardCharsets.UTF_8);
            String[] fields = rawPayload.split(":");
            if (fields.length != 4) return null;

            Long userId = Long.parseLong(fields[0]);
            String username = fields[1];
            String role = fields[2];
            long expiry = Long.parseLong(fields[3]);

            TokenPayload payload = new TokenPayload(userId, username, role, expiry);
            if (payload.isExpired()) return null;
            return payload;
        } catch (Exception e) {
            return null;
        }
    }

    private static String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] sigBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(sigBytes);
        } catch (Exception e) {
            throw new RuntimeException("HMAC signing failed", e);
        }
    }
}
