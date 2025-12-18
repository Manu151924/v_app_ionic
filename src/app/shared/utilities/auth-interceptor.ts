import { Injectable, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import {
  catchError,
  filter,
  switchMap,
  take,
  finalize
} from 'rxjs/operators';
import { Auth } from '../services/auth';
import { Api } from '../services/api';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  private auth = inject(Auth);
  private api = inject(Api);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    return from(this.auth.getAccessToken()).pipe(
      switchMap(token => {

        const authReq = token
          ? req.clone({
              setHeaders: { Authorization: `Bearer ${token}` }
            })
          : req;

        return next.handle(authReq).pipe(
          catchError(err => this.handleError(err, authReq, next))
        );
      })
    );
  }

  private handleError(
    error: any,
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    if (
      error instanceof HttpErrorResponse &&
      (error.status === 401 || error.status === 403) &&
      !this.isExcludedUrl(request.url)
    ) {
      return this.handleTokenRefresh(request, next);
    }

    return throwError(() => error);
  }

  private isExcludedUrl(url: string): boolean {
    return (
      url.includes('SENDOTP') ||
      url.includes('VERIFYOTP') ||
      url.includes('generateAccessTokenFromRefreshToken')
    );
  }

  private handleTokenRefresh(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return from(this.auth.getRefreshToken()).pipe(
        switchMap(refreshToken => {

          if (!refreshToken) {
            this.safeLogout();
            return throwError(() => new Error('No refresh token'));
          }

          return this.api.generateAccessTokenFromRefreshToken(refreshToken);
        }),

        switchMap((res: any) => {
          const newAccessToken = res?.data?.accessToken;

          if (!newAccessToken) {
            this.safeLogout();
            return throwError(() => new Error('Invalid refresh response'));
          }

          return from(this.auth.updateAccessToken(newAccessToken)).pipe(
            switchMap(() => {
              this.refreshTokenSubject.next(newAccessToken);

              return next.handle(
                request.clone({
                  setHeaders: { Authorization: `Bearer ${newAccessToken}` }
                })
              );
            })
          );
        }),

        finalize(() => {
          this.isRefreshing = false;
        }),

        catchError(err => {
          this.safeLogout();
          return throwError(() => err);
        })
      );
    }

    // Queue pending requests
    return this.refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token =>
        next.handle(
          request.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
          })
        )
      )
    );
  }

  private safeLogout() {
    this.isRefreshing = false;
    this.refreshTokenSubject.next(null);

    // Avoid breaking interceptor chain
    setTimeout(() => {
      this.auth.logout();
    });
  }
}
