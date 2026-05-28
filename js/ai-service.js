// ==================== AI SERVICE CONFIG ====================
// ai-service.js - Service central IA

class ImmoGestAI {
  constructor() {
    this.models = {
      ocr: null,
      anomaly: null,
      voice: null
    };
    this.initialized = false;
  }

  async init() {
    // Charger les modèles légers
    this.models.ocr = await this.loadOCRModel();
    this.models.anomaly = await this.loadAnomalyModel();
    this.initialized = true;
    console.log('🤖 ImmoGest AI Service initialisé');
  }

  // ========== 4. OCR DOCUMENTS ==========
  async extractDocument(file) {
    const image = await this.preprocessImage(file);
    const predictions = await this.models.ocr.detect(image);
    
    return {
      type: this.classifyDocument(predictions),
      data: this.extractFields(predictions),
      confidence: predictions.confidence,
      raw: predictions
    };
  }

  classifyDocument(predictions) {
    const labels = predictions.map(p => p.label);
    if (labels.includes('quittance')) return 'quittance';
    if (labels.includes('contrat')) return 'contrat_bail';
    if (labels.includes('caution')) return 'caution';
    return 'autre';
  }

  extractFields(predictions) {
    const fields = {};
    predictions.forEach(pred => {
      if (pred.label === 'montant') fields.montant = pred.value;
      if (pred.label === 'date') fields.date = pred.value;
      if (pred.label === 'nom') fields.nom = pred.value;
      if (pred.label === 'adresse') fields.adresse = pred.value;
    });
    return fields;
  }

  preprocessImage(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 1024;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 1024, 1024);
        resolve(canvas);
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // ========== 5. DÉTECTION ANOMALIES ==========
  detectAnomalies(data) {
    const anomalies = [];
    
    // Anomalie 1: Impayés répétés
    const latePayments = data.payments.filter(p => p.status === 'late');
    if (latePayments.length >= 3) {
      anomalies.push({
        type: 'payment_pattern',
        severity: 'high',
        message: `Locataire ${data.tenant.name}: ${latePayments.length} impayés consécutifs`,
        recommendation: 'Envisager une relance juridique'
      });
    }

    // Anomalie 2: Loyers anormalement bas
    const avgRent = this.calculateAverageRent(data.marketData);
    if (data.tenant.rent <avgRent * 0.7) {
      anomalies.push({
        type: 'underpriced',
        severity: 'medium',
        message: `Loyer sous-évalué de ${((1 - data.tenant.rent/avgRent)*100).toFixed(1)}%`,
        recommendation: 'Réviser le loyer lors du renouvellement'
      });
    }

    // Anomalie 3: Dépenses inhabituelles
    const expenseSpike = this.detectExpenseSpike(data.expenses);
    if (expenseSpike) {
      anomalies.push({
        type: 'expense_spike',
        severity: 'medium',
        message: `Dépenses maintenance +${expenseSpike.percentage}% ce mois`,
        recommendation: 'Vérifier les factures et contrats'
      });
    }

    return anomalies;
  }

  detectExpenseSpike(expenses) {
    const current = expenses.slice(-30).reduce((a,b) => a + b.amount, 0);
    const previous = expenses.slice(-60, -30).reduce((a,b) => a + b.amount, 0);
    if (previous === 0) return null;
    const increase = ((current - previous) / previous) * 100;
    return increase > 50 ? { percentage: increase.toFixed(0) } : null;
  }

  // ========== 6. COMMANDES VOCALES ==========
  async processVoiceCommand(transcript) {
    const commands = {
      'impayé': () => this.showLatePayments(),
      'loyer': () => this.showRentStatus(),
      'maintenance': () => this.showMaintenanceRequests(),
      'alerte': () => this.showAlerts(),
      'dashboard': () => this.showDashboard(),
      'rapport': () => this.generateQuickReport(),
      'locataire': (name) => this.searchTenant(name),
      'immeuble': (name) => this.searchBuilding(name)
    };

    const lowerTranscript = transcript.toLowerCase();
    
    for (const [keyword, handler] of Object.entries(commands)) {
      if (lowerTranscript.includes(keyword)) {
        const param = lowerTranscript.replace(keyword, '').trim();
        return handler(param);
      }
    }
    
    return { error: 'Commande non reconnue', transcript };
  }

  showLatePayments() {
    const late = window.DB.payments.filter(p => {
      const due = new Date(p.dueDate);
      return p.status !== 'paid' && due <new Date();
    });
    return { action: 'navigate', view: 'relances', data: late };
  }

  // Chargement modèles (simulation - en prod: TensorFlow.js)
  async loadOCRModel() {
    // En production: await tf.loadLayersModel('/models/ocr-v1/model.json');
    return { detect: async (img) => ({ /* mock */ }) };
  }

  async loadAnomalyModel() {
    return { predict: async (data) => ({ /* mock */ }) };
  }

  calculateAverageRent(marketData) {
    if (!marketData || marketData.length === 0) return 0;
    return marketData.reduce((a,b) => a + b.rent, 0) / marketData.length;
  }
}

// Instance globale
window.ImmoAI = new ImmoGestAI();
