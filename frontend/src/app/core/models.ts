export interface User {
  id: number;
  username: string;
  role: 'admin' | 'manager';
}

export interface Artist {
  id: number;
  name: string;
  bio: string;
  image: string;
}

export interface PortfolioWork {
  id: number;
  title: string;
  description: string;
  artistId: number | null;
  image: string;
}

export interface Video {
  id: number;
  title: string;
  url: string;
}

export interface BlogPost {
  id: number;
  title: string;
  summary: string;
  content: string;
  date: string;
}

export interface CitationRequest {
  id: number;
  name: string;
  email: string;
  phone: string;
  artist: string;
  style: string;
  bodyPart: string;
  size: string;
  idea: string;
  observations: string;
  status: string;
  createdAt: string;
}

export interface Appointment {
  id: number;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  artistName: string;
  style: string;
  date: string;
  time: string;
  notes: string;
  requestId: number | null;
  status: string;
  createdAt: string;
}
