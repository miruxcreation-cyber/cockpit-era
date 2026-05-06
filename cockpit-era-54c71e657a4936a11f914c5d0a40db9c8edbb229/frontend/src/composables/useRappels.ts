import type { Rdv } from '../types/domain'

export function buildReminderMessages(rdv: Rdv): string[] {
  const prenom = (rdv.client || '').split(' ')[0]
  return [
    `Bonjour ${prenom}, je confirme notre rendez-vous aujourd'hui a ${rdv.heure}.`,
    `Bonjour ${prenom}, je suis en route.`,
    `Bonjour ${prenom}, pouvez-vous me rappeler pour faire un point ?`,
  ]
}

export function scheduleReminder(rdv: Rdv, callback: () => void) {
  const date = new Date(`${rdv.date}T${rdv.heure}`)
  const delay = date.getTime() - Date.now() - 30 * 60 * 1000
  if (delay > 0) {
    setTimeout(callback, delay)
  }
}
