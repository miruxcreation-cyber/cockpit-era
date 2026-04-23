export interface Mandat {
  id: string
  vendeur: string
  tel?: string
  email?: string
  ref?: string
  adresse: string
  type?: string
  surface?: string
  prix?: string
  fai?: string
  mandat?: 'exclusif' | 'simple' | 'co-exclusif' | string
  source?: 'direct' | 'ma' | string
  taux?: number
  dateSign?: string
  dateExp?: string
  statut: string
  notes?: string
  created?: string
}

export interface Acquereur {
  id: string
  nom: string
  tel?: string
  profil?: string
  budget?: string
  type?: string
  secteur?: string
  statut: string
  notes?: string
}

export interface Rdv {
  id: string
  client: string
  date: string
  heure: string
  objet?: string
  tel?: string
  done?: boolean
}

export interface Note {
  id: string
  titre: string
  contenu: string
  type: string
  date: string
}

export interface Secteur {
  id: string
  nom: string
  ville?: string
  desc?: string
}

export interface Copro {
  id: string
  secteurId: string
  adresse: string
  notes?: string
}

export interface Proprietaire {
  id: string
  coproId: string
  nom: string
  prenom?: string
  telephone?: string
  email?: string
  numLot?: string
  typeBien?: string
  surface?: number
  etage?: string
  profil?: string
  source?: string
  statut?: string
  derniereRelance?: string
  lienDrive?: string
  notes?: string
}
