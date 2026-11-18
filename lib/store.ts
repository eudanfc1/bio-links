import { hasSupabase, supaGetBundle, supaListProfiles, supaGetProfileBySlug, supaGetProfileById, supaSaveProfile, supaListLinks, supaSaveLink, supaDeleteLink, supaListPartners, supaSavePartner, supaDeletePartner, supaListStories, supaSaveStory, supaDeleteStory, supaGetActiveNotice, supaSaveNotice, supaRecordClick, supaSummarizeClicks } from './store-supabase';
import {
  seedIfEmpty as seedFile,
  getBundle as getBundleFile,
  listProfiles as fileListProfiles,
  getProfileBySlug as fileGetProfileBySlug,
  getProfileById as fileGetProfileById,
  saveProfile as fileSaveProfile,
  listLinks as fileListLinks,
  saveLink as fileSaveLink,
  deleteLink as fileDeleteLink,
  listPartners as fileListPartners,
  savePartner as fileSavePartner,
  deletePartner as fileDeletePartner,
  listStories as fileListStories,
  saveStory as fileSaveStory,
  deleteStory as fileDeleteStory,
  getActiveNotice as fileGetActiveNotice,
  saveNotice as fileSaveNotice,
  recordClick as fileRecordClick,
  summarizeClicks as fileSummarizeClicks,
} from './store-file';

const useSupa = hasSupabase();

/* ================================================================== */

/**
 * Escolhe a implementação conforme o backend configurado.
 *
 * Os dois argumentos são *funções* (thunks) de propósito: avaliar os dois
 * eagerly executaria a implementação do Supabase mesmo sem ele configurado,
 * e `getSupabase()` devolveria null — quebrando a página com `null.from`.
 */
function pick<T>(supa: () => T, local: () => T): T {
  return useSupa ? supa() : local();
}

/* ================================================================== */
/* Perfis                                                              */
/* ================================================================== */

export async function listProfiles() {
  return pick(supaListProfiles, fileListProfiles);
}

export async function getProfileBySlug(slug: string) {
  return pick(() => supaGetProfileBySlug(slug), () => fileGetProfileBySlug(slug));
}

export async function getProfileById(id: string) {
  return pick(() => supaGetProfileById(id), () => fileGetProfileById(id));
}

export async function saveProfile(p: Parameters<typeof supaSaveProfile>[0]) {
  return pick(() => supaSaveProfile(p), () => fileSaveProfile(p));
}

/* ================================================================== */
/* Links                                                               */
/* ================================================================== */

export async function listLinks(profileId: string) {
  return pick(() => supaListLinks(profileId), () => fileListLinks(profileId));
}

export async function saveLink(link: Parameters<typeof supaSaveLink>[0]) {
  return pick(() => supaSaveLink(link), () => fileSaveLink(link));
}

export async function deleteLink(id: string) {
  return pick(() => supaDeleteLink(id), () => fileDeleteLink(id));
}

/* ================================================================== */
/* Parceiros oficiais                                                  */
/* ================================================================== */

export async function listPartners(profileId: string) {
  return pick(() => supaListPartners(profileId), () => fileListPartners(profileId));
}

export async function savePartner(partner: Parameters<typeof supaSavePartner>[0]) {
  return pick(() => supaSavePartner(partner), () => fileSavePartner(partner));
}

export async function deletePartner(id: string) {
  return pick(() => supaDeletePartner(id), () => fileDeletePartner(id));
}

/* ================================================================== */
/* Stories                                                             */
/* ================================================================== */

export async function listStories(profileId: string) {
  return pick(() => supaListStories(profileId), () => fileListStories(profileId));
}

export async function saveStory(story: Parameters<typeof supaSaveStory>[0]) {
  return pick(() => supaSaveStory(story), () => fileSaveStory(story));
}

export async function deleteStory(id: string) {
  return pick(() => supaDeleteStory(id), () => fileDeleteStory(id));
}

/* ================================================================== */
/* Aviso                                                               */
/* ================================================================== */

export async function getActiveNotice(profileId: string) {
  return pick(() => supaGetActiveNotice(profileId), () => fileGetActiveNotice(profileId));
}

export async function saveNotice(notice: Parameters<typeof supaSaveNotice>[0]) {
  return pick(() => supaSaveNotice(notice), () => fileSaveNotice(notice));
}

/* ================================================================== */
/* Cliques                                                             */
/* ================================================================== */

export async function recordClick(click: Parameters<typeof supaRecordClick>[0]) {
  return pick(() => supaRecordClick(click), () => fileRecordClick(click));
}

export async function summarizeClicks(profileId: string, opts?: Parameters<typeof supaSummarizeClicks>[1]) {
  return pick(() => supaSummarizeClicks(profileId, opts), () => fileSummarizeClicks(profileId, opts));
}

/* ================================================================== */
/* Bundle (página pública)                                             */
/* ================================================================== */

export async function getBundle(slug: string) {
  return pick(() => supaGetBundle(slug), () => getBundleFile(slug));
}

/** Garante que há dados para demo. Nenhuma ação se já existirem. */
export async function ensureSeed() {
  if (!useSupa) await seedFile();
}
