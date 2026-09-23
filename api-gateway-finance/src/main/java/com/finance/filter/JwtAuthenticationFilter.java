package com.finance.filter;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;

@Component
public class JwtAuthenticationFilter implements GlobalFilter {

	private final String SECRET = "MySuperSecretKeyForFinanceApp123456789!";
	private final SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes());

	@Override
	public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
		String path = exchange.getRequest().getURI().getPath();

		// Let login and register pass without a token
		if (path.contains("/api/auth")) {
			return chain.filter(exchange);
		}

		String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
		if (authHeader == null || !authHeader.startsWith("Bearer ")) {
			exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
			return exchange.getResponse().setComplete();
		}

		String token = authHeader.substring(7);
		try {
			Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
		} catch (Exception e) {
			exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
			return exchange.getResponse().setComplete();
		}

		return chain.filter(exchange);
	}
}