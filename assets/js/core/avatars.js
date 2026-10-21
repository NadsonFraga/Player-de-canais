/**
 * TVZINHA ONLINE - The profile avatars (files in assets/img/avatars/, built by tools/make_avatars.mjs).
 *
 * l01-l12 "Lorelei" (Lisa Wischofsky) and n01-n12 "Notionists" (Zoish), both CC0; i01-i08 our own line icons.
 * The server accepts exactly these ids (AVATARS in functions/api/account/[[path]].js).
 */
const ids = (prefix, count) => Array.from({ length: count }, (_, i) => `${prefix}${String(i + 1).padStart(2, '0')}`);

export const AVATAR_FACES = [...ids('l', 12), ...ids('n', 12)];
export const AVATAR_ICONS = ids('i', 8);
export const DEFAULT_AVATAR = 'l01';

export function avatarSrc(id) {
    const known = AVATAR_FACES.includes(id) || AVATAR_ICONS.includes(id);
    return `assets/img/avatars/${known ? id : DEFAULT_AVATAR}.svg`;
}

/** An avatar not used by the other profiles yet, for "Adicionar perfil". */
export function freeAvatar(profiles = []) {
    const taken = new Set(profiles.map(p => p.avatar));
    return AVATAR_FACES.find(id => !taken.has(id)) || DEFAULT_AVATAR;
}
