/**
 * 统一的管理员鉴权
 *
 * 采用 fail-closed：环境变量缺失时拒绝一切写操作。
 * 关键点是「把失败原因说清楚」——旧实现直接返回「密码错误」，
 * 环境变量丢了会导致连管理员自己都进不去，却完全看不出真实原因。
 */
export interface AuthResult {
  ok: boolean;
  /** 失败原因，可直接返回给前端展示 */
  reason?: string;
}

export function verifyAdmin(password: string | undefined | null): AuthResult {
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected) {
    return {
      ok: false,
      reason: "服务端未配置 ADMIN_PASSWORD，请检查 Vercel 环境变量",
    };
  }

  if (!password || password !== expected) {
    return { ok: false, reason: "密码错误" };
  }

  return { ok: true };
}
