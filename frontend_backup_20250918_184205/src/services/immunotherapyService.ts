import api from './api';

export interface LastTreatmentData {
  subtipo: string;
  unidades: number;
  dosis: number;
  alergenos: string[];
  frascos: string[];
  productId?: string;
  observaciones: string;
  fechaTratamiento: string;
}

export interface ImmunotherapyRecord {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  pacienteApellido: string;
  fechaInicio: string;
  ultimaEdicion: string;
  fechaUltimaAplicacion: string;
  logEntries: any[];
  totalTratamientos: number;
  ultimoTratamiento: any;
  alergenos: string[];
  reacciones: string[];
}

class ImmunotherapyService {
  /**
   * Obtiene el último tratamiento de un paciente para pre-rellenar formulario
   */
  async getLastTreatmentForPatient(pacienteId: string): Promise<LastTreatmentData | null> {
    try {
      console.log(`🔍 [ImmunotherapyService] Obteniendo último tratamiento para paciente: ${pacienteId}`);
      
      const response = await api.get(`/immunotherapy/last-treatment/${pacienteId}`);
      
      if (response.data.success) {
        console.log(`✅ [ImmunotherapyService] Último tratamiento obtenido:`, response.data.data);
        return response.data.data;
      } else {
        console.log(`ℹ️ [ImmunotherapyService] No se encontró tratamiento previo:`, response.data.error);
        return null;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`ℹ️ [ImmunotherapyService] No se encontró tratamiento previo para paciente: ${pacienteId}`);
        return null;
      }
      console.error(`❌ [ImmunotherapyService] Error obteniendo último tratamiento:`, error);
      throw error;
    }
  }

  /**
   * Obtiene el expediente completo de inmunoterapia de un paciente
   */
  async getPatientRecord(pacienteId: string): Promise<ImmunotherapyRecord | null> {
    try {
      console.log(`🔍 [ImmunotherapyService] Obteniendo expediente para paciente: ${pacienteId}`);
      
      const response = await api.post(`/immunotherapy/record/${pacienteId}`, {
        organizacionId: '550e8400-e29b-41d4-a716-446655440000' // TODO: Obtener del contexto del usuario
      });
      
      if (response.data.success) {
        console.log(`✅ [ImmunotherapyService] Expediente obtenido:`, response.data.data);
        return response.data.data;
      } else {
        console.log(`ℹ️ [ImmunotherapyService] No se encontró expediente:`, response.data.error);
        return null;
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log(`ℹ️ [ImmunotherapyService] No se encontró expediente para paciente: ${pacienteId}`);
        return null;
      }
      console.error(`❌ [ImmunotherapyService] Error obteniendo expediente:`, error);
      throw error;
    }
  }

  /**
   * Verifica si un paciente tiene expediente de inmunoterapia
   */
  async hasRecord(pacienteId: string): Promise<boolean> {
    try {
      const response = await api.get(`/immunotherapy/has-record?pacienteId=${pacienteId}&organizacionId=550e8400-e29b-41d4-a716-446655440000`);
      return response.data.success && response.data.data.hasRecord;
    } catch (error) {
      console.error(`❌ [ImmunotherapyService] Error verificando expediente:`, error);
      return false;
    }
  }
}

export default new ImmunotherapyService();
















