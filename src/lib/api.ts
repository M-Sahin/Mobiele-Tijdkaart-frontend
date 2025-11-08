/**
 * API Wrapper voor geautoriseerde requests naar de .NET backend
 */

// Base URL voor de API - gebruik omgevingsvariabele of fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5123/api';

/**
 * Authorized Fetch wrapper
 * Voegt automatisch JWT Bearer token toe aan requests
 */
export async function authorizedFetch(
  endpoint: string,
  options?: RequestInit
): Promise<Response> {
  // Haal token op uit localStorage
  const token = localStorage.getItem('auth_token');

  // Bouw de volledige URL
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Merge headers met Authorization header
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  // Voeg Authorization header toe als token bestaat
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // Voer de fetch uit met gemergde opties
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Error handling voor 401 Unauthorized
    if (response.status === 401) {
      // Verwijder ongeldige token
      localStorage.removeItem('auth_token');
      
      // Redirect naar login (alleen als we in browser context zijn)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      throw new Error('Unauthorized: Session expired. Please login again.');
    }

    // Error handling voor andere HTTP errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message || 
        `HTTP Error ${response.status}: ${response.statusText}`
      );
    }

    return response;
  } catch (error) {
    // Als het een netwerk error is
    if (error instanceof TypeError) {
      throw new Error('Network error: Unable to reach the API server');
    }
    
    // Re-throw andere errors
    throw error;
  }
}

/**
 * Helper functie voor GET requests
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const response = await authorizedFetch(endpoint, {
    method: 'GET',
  });
  return response.json();
}

/**
 * Helper functie voor POST requests
 */
export async function apiPost<T>(endpoint: string, data?: any): Promise<T> {
  const response = await authorizedFetch(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

/**
 * Helper functie voor PUT requests
 */
export async function apiPut<T>(endpoint: string, data?: any): Promise<T> {
  const response = await authorizedFetch(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
  return response.json();
}

/**
 * Helper functie voor DELETE requests
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  const response = await authorizedFetch(endpoint, {
    method: 'DELETE',
  });
  return response.json();
}

/**
 * Login functie (geen Authorization header nodig)
 */
export async function login(email: string, password: string): Promise<{ token: string }> {
  const url = `${API_BASE_URL}/auth/login`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Login failed');
    }

    return response.json();
  } catch (error) {
    // Als het een netwerk error is
    if (error instanceof TypeError) {
      console.error('Network error during login:', error);
      throw new Error('Kan geen verbinding maken met de server. Controleer je internetverbinding.');
    }
    
    // Re-throw andere errors
    throw error;
  }
}

/**
 * Register functie (geen Authorization header nodig)
 */
export async function register(email: string, wachtwoord: string, wachtwoordBevestiging: string): Promise<{ token?: string; message?: string }> {
  const url = `${API_BASE_URL}/auth/register`;
  
  console.log('Attempting registration to:', url);
  console.log('Request body:', { email, wachtwoord: '***', wachtwoordBevestiging: '***' });
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, wachtwoord, wachtwoordBevestiging }),
    });

    console.log('Registration response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Registration error response:', errorData);
      throw new Error(errorData?.message || 'Registratie mislukt');
    }

    // De API returnt mogelijk geen token, dus we maken het optioneel
    const data = await response.json().catch(() => ({}));
    return data;
  } catch (error) {
    // Als het een netwerk error is
    if (error instanceof TypeError) {
      console.error('Network error during registration:', error);
      throw new Error('Kan geen verbinding maken met de server. Controleer je internetverbinding en of de API beschikbaar is.');
    }
    
    // Re-throw andere errors
    throw error;
  }
}

// ===== TypeScript Interfaces voor Tijdregistratie =====

export interface Project {
  id: number;
  naam: string;
  klantnaam?: string;  // Backend veld
  uurtarief?: number;  // Backend veld
}

export interface TijdRegistratie {
  id: number;
  projectId: number;
  startTijd: string;
  eindTijd?: string | null;
  omschrijving?: string | null;
}

// ===== Tijdregistratie API Functies =====

/**
 * Haal alle projecten op
 */
export async function getProjecten(): Promise<Project[]> {
  try {
    return await apiGet<Project[]>('/projecten');
  } catch (error) {
    console.error('Error fetching projecten:', error);
    // Return empty array als fallback
    return [];
  }
}

/**
 * Maak een nieuw project aan
 */
export async function createProject(naam: string, klantnaam?: string, uurtarief?: number): Promise<Project> {
  return await apiPost<Project>('/projecten', { naam, klantnaam, uurtarief });
}

/**
 * Update een bestaand project
 */
export async function updateProject(id: number, naam: string, klantnaam?: string, uurtarief?: number): Promise<Project> {
  return await apiPut<Project>(`/projecten/${id}`, { naam, klantnaam, uurtarief });
}

/**
 * Archiveer/verwijder een project
 */
export async function deleteProject(id: number): Promise<void> {
  await apiDelete<void>(`/projecten/${id}`);
}

/**
 * Haal lopende tijdregistratie op
 */
export async function getLopendeTijdRegistratie(): Promise<TijdRegistratie | null> {
  try {
    return await apiGet<TijdRegistratie>('/tijd/lopend');
  } catch (error) {
    // 404 betekent geen lopende registratie
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    console.error('Error fetching lopende tijd:', error);
    return null;
  }
}

/**
 * Start nieuwe tijdregistratie
 */
export async function startTijdRegistratie(projectId: number, startTijd: string, omschrijving?: string): Promise<TijdRegistratie> {
  return await apiPost<TijdRegistratie>('/tijd', {
    projectId,
    startTijd,
    omschrijving
  });
}

/**
 * Stop lopende tijdregistratie
 */
export async function stopTijdRegistratie(id: number): Promise<TijdRegistratie> {
  return await apiPut<TijdRegistratie>(`/tijd/${id}/stop`, {});
}

/**
 * Haal alle tijdregistraties op
 */
export async function getAlleTijdRegistraties(): Promise<TijdRegistratie[]> {
  try {
    return await apiGet<TijdRegistratie[]>('/tijd');
  } catch (error) {
    console.error('Error fetching tijd registraties:', error);
    return [];
  }
}

/**
 * Haal tijdregistraties per project op
 */
export async function getTijdRegistratiesPerProject(projectId: number): Promise<TijdRegistratie[]> {
  try {
    return await apiGet<TijdRegistratie[]>(`/tijd/project/${projectId}`);
  } catch (error) {
    console.error('Error fetching tijd registraties per project:', error);
    return [];
  }
}
