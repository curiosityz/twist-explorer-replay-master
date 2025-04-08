import { VulnerabilityCase } from '@/types';
import { supabase, Tables } from '@/integrations/supabase/client';

// Fetch real vulnerability cases from the database
export const fetchVulnerabilityCases = async (): Promise<VulnerabilityCase[]> => {
  try {
    const { data, error } = await supabase
      .from(Tables.vulnerability_analyses)
      .select('*');

    if (error) {
      console.error('Error fetching vulnerability cases:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching vulnerability cases:', error);
    return [];
  }
};
