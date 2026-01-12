import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpErrorResponse,
} from '@angular/common/http';
import { BehaviorSubject, from, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, finalize } from 'rxjs/operators';
import { Auth } from '../services/auth';
import { Api } from '../services/api';
import { SessionTimeout } from '../services/session-timeout';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshToken$ = new BehaviorSubject<string | null>(null);

  private auth = inject(Auth);
  private api = inject(Api);
  private sessionTimeout = inject(SessionTimeout);

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    if (req.headers.get('Authorization') === 'Bearer SKIP_AUTH') {
      const cleanReq = req.clone({
        headers: req.headers.delete('Authorization'),
      });
      return next.handle(cleanReq);
    }

    return from(this.auth.getAccessToken()).pipe(
      switchMap((token) => {
        if (token && this.auth.isTokenExpired(token)) {
          return this.isRefreshing
            ? this.waitForToken(req, next)
            : this.handleRefresh(req, next);
        }

        const request = token
          ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
          : req;

        return next
          .handle(request)
          .pipe(catchError((err) => this.handleError(err, request, next)));
      })
    );
  }

  private handleError(
    error: any,
    request: HttpRequest<any>,
    next: HttpHandler
  ) {
    if (
      error instanceof HttpErrorResponse &&
      (error.status === 401 || error.status === 403)
    ) {
      return from(this.auth.getRefreshToken()).pipe(
        switchMap((token) => {
          if (!token || this.auth.isRefreshTokenExpired(token)) {
            return from(this.auth.forceLogout()).pipe(
              switchMap(() => throwError(() => error))
            );
          }

          return this.isRefreshing
            ? this.waitForToken(request, next)
            : this.handleRefresh(request, next);
        })
      );
    }

    if (error.status === 0 || error.status === 503) {
      this.auth.getRefreshToken().then((token) => {
        if (token && !this.auth.isRefreshTokenExpired(token)) {
          this.sessionTimeout.set('SERVER_DOWN'); // popup trigger
        } else {
          this.auth.forceLogout();
        }
      });

      return throwError(() => error);
    }

    return throwError(() => error);
  }

  private handleRefresh(request: HttpRequest<any>, next: HttpHandler) {
    this.isRefreshing = true;
    this.refreshToken$.next(null);

    return from(this.auth.getRefreshToken()).pipe(
      switchMap((token) => {
        if (!token || this.auth.isRefreshTokenExpired(token)) {
          return from(this.auth.forceLogout()).pipe(
            switchMap(() => throwError(() => 'Refresh expired'))
          );
        }

        return this.api.generateAccessTokenFromRefreshToken(token);
      }),
      switchMap((res: any) => {
        const newToken = res?.data?.accessToken;
        if (!newToken) {
          return from(this.auth.forceLogout()).pipe(
            switchMap(() => throwError(() => 'Invalid refresh'))
          );
        }

        return from(this.auth.updateAccessToken(newToken)).pipe(
          switchMap(() => {
            this.refreshToken$.next(newToken);
            return next.handle(
              request.clone({
                setHeaders: { Authorization: `Bearer ${newToken}` },
              })
            );
          })
        );
      }),
      finalize(() => (this.isRefreshing = false))
    );
  }

  private waitForToken(request: HttpRequest<any>, next: HttpHandler) {
    return this.refreshToken$.pipe(
      filter((token) => !!token),
      take(1),
      switchMap((token) =>
        next.handle(
          request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        )
      )
    );
  }
}
