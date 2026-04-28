import { PlaceResult } from '@/types';

export async function searchPlaces(query: string, maxResults: number = 20): Promise<PlaceResult[]> {
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('GOOGLE_PLACES_API_KEY não configurada no servidor.');
  }

  const url = 'https://places.googleapis.com/v1/places:searchText';
  const allPlaces: {
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    nationalPhoneNumber?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    primaryTypeDisplayName?: { text: string };
    regularOpeningHours?: {
      periods?: Array<{
        open?: { day: number; hour: number; minute: number };
        close?: { day: number; hour: number; minute: number };
      }>;
    };
    photos?: Array<{ name: string }>;
  }[] = [];
  let nextToken: string | undefined = undefined;
  
  const iterations = Math.ceil(maxResults / 20);

  for (let i = 0; i < iterations; i++) {
    const payload: {
      textQuery: string;
      languageCode: string;
      maxResultCount: number;
      pageToken?: string;
    } = {
      textQuery: query,
      languageCode: 'pt-BR',
      maxResultCount: Math.min(20, maxResults - allPlaces.length),
    };

    if (nextToken) {
      payload.pageToken = nextToken;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.primaryTypeDisplayName,places.regularOpeningHours,places.photos,nextPageToken',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Google Places API error:', err);
      if (allPlaces.length > 0) break;
      throw new Error(`Google Places API retornou erro: ${response.status}`);
    }

    const data = await response.json();
    const places = data.places || [];
    allPlaces.push(...places);
    
    nextToken = data.nextPageToken;
    if (!nextToken || allPlaces.length >= maxResults) break;
  }

  return allPlaces.map((place) => {
    let extraida = '';
    if (place.formattedAddress) {
      const parts = place.formattedAddress.split(' - ');
      if (parts.length > 2) extraida = parts[parts.length - 2].trim().split(',')[0];
      else extraida = place.formattedAddress;
    }

    let horarioAbertura = null;
    if (place.regularOpeningHours?.periods) {
      const today = new Date().getDay();
      const period = place.regularOpeningHours.periods.find(p => p.open?.day === today) || place.regularOpeningHours.periods[0];
      if (period?.open) {
        const h = period.open.hour.toString().padStart(2, '0');
        const m = period.open.minute.toString().padStart(2, '0');
        horarioAbertura = `${h}:${m}`;
      }
    }

    // Gerar URLs das fotos via proxy interno para proteger a API Key
    const fotos = (place.photos || []).slice(0, 3).map(photo => 
      `/api/places/photo/${photo.name}?maxWidthPx=400`
    );

    return {
      place_id: place.id,
      nome: place.displayName?.text || '',
      endereco: place.formattedAddress || null,
      cidade: extraida || null,
      telefone: place.nationalPhoneNumber || null,
      site: place.websiteUri || null,
      rating: place.rating || null,
      total_reviews: place.userRatingCount || null,
      categoria: place.primaryTypeDisplayName?.text || null,
      horario_abertura: horarioAbertura,
      fotos: fotos.length > 0 ? fotos : null,
    };
  });
}
