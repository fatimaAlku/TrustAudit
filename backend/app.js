const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const config = require('./config/config');
const serviceAccount = require('./firebase-admin-sdk.json');

const app = express();

// Initialize Firebase Admin with local service account for Firestore
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// Allow the frontend dev server to call this API
const ALLOWED_ORIGIN = 'http://localhost:5173';

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.header(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,OPTIONS',
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type',
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: config.env,
    timestamp: new Date().toISOString(),
  });
});

// Preloaded control library based on common frameworks
const controlLibrary = [
  // ISO 27001 examples
  {
    id: 'ISO-27001-A.5.1',
    framework: 'ISO 27001',
    title: 'Information security policies',
    description:
      'Information security policies shall be defined, approved by management, published and communicated to employees and relevant external parties.',
    requiredEvidence: [
      'Information security policy document',
      'Approval from senior management',
      'Communication records or training material',
    ],
    controlObjectives:
      'Provide management direction and support for information security in accordance with business requirements and relevant laws and regulations.',
  },
  {
    id: 'ISO-27001-A.9.2',
    framework: 'ISO 27001',
    title: 'User access management',
    description:
      'Formal user registration and de-registration shall be implemented to enable assignment of access rights.',
    requiredEvidence: [
      'User access provisioning procedures',
      'Sample access requests and approvals',
      'User access review reports',
    ],
    controlObjectives:
      'Ensure that users are properly registered and access rights are appropriately assigned, modified and removed.',
  },
  // NIST CSF examples
  {
    id: 'NIST-CSF-ID.AM-1',
    framework: 'NIST CSF',
    title: 'Asset management – Physical devices and systems',
    description:
      'Physical devices and systems within the organization are inventoried.',
    requiredEvidence: [
      'Asset inventory register',
      'Configuration management database (CMDB) extracts',
      'Sample asset ownership records',
    ],
    controlObjectives:
      'Maintain an accurate inventory of physical devices and systems to support risk management and security operations.',
  },
  {
    id: 'NIST-CSF-PR.AC-1',
    framework: 'NIST CSF',
    title: 'Access control – Identities and credentials',
    description:
      'Identities and credentials are issued, managed, verified, revoked, and audited for authorized devices, users, and processes.',
    requiredEvidence: [
      'Identity and access management (IAM) procedures',
      'Sample user lifecycle records',
      'Access review and recertification reports',
    ],
    controlObjectives:
      'Ensure only authorized and authenticated users and systems can access organizational resources.',
  },
  // COBIT examples
  {
    id: 'COBIT-APO01',
    framework: 'COBIT',
    title: 'Manage the IT management framework',
    description:
      'Establish and maintain an effective IT management framework that aligns with enterprise objectives.',
    requiredEvidence: [
      'IT governance framework documentation',
      'IT steering committee charter and minutes',
      'Roles and responsibilities matrices (RACI)',
    ],
    controlObjectives:
      'Ensure that IT-related decisions are aligned with business objectives and governance requirements.',
  },
  {
    id: 'COBIT-DSS05',
    framework: 'COBIT',
    title: 'Manage security services',
    description:
      'Protect enterprise information to maintain the level of information security risk acceptable to the enterprise in accordance with its security policy.',
    requiredEvidence: [
      'Security operations procedures',
      'Incident response playbooks',
      'Monitoring and alerting configurations',
    ],
    controlObjectives:
      'Reduce the impact of security incidents and maintain an acceptable level of information security risk.',
  },
];

// Base router for API resources
const apiRouter = express.Router();

// Audits endpoints
apiRouter.get('/audits', async (req, res) => {
  try {
    const snapshot = await db.collectionGroup('audits').get();
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      const orgRef = doc.ref.parent.parent;
      const organization = orgRef ? orgRef.id : data.organization || 'Default Organization';
      return {
        id: doc.id,
        ...data,
        organization,
      };
    });
    res.json({ items });
  } catch (err) {
    console.error('Error fetching audits from Firestore', err);
    res.status(500).json({ error: 'Failed to fetch audits' });
  }
});

apiRouter.post('/audits', async (req, res) => {
  const {
    name,
    scope,
    teamMembers,
    framework,
    timeline,
    organization,
    status = 'Planned',
    progress = 0,
  } = req.body || {};

  if (!name || !framework) {
    return res.status(400).json({ error: 'Missing required fields: name, framework' });
  }
  const orgId = organization || 'Default_Organization';

  const data = {
    name,
    scope: scope || '',
    teamMembers: teamMembers || '',
    framework,
    timeline: timeline || '',
    status,
    progress,
    createdAt: new Date().toISOString(),
  };

  try {
    const docRef = await db
      .collection('organizations')
      .doc(orgId)
      .collection('audits')
      .add(data);

    const audit = {
      id: docRef.id,
      ...data,
      organization: orgId,
    };

    res.status(201).json(audit);
  } catch (err) {
    console.error('Error creating audit in Firestore', err);
    res.status(500).json({ error: 'Failed to create audit' });
  }
});

apiRouter.put('/audits/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const snapshot = await db
      .collectionGroup('audits')
      .where(admin.firestore.FieldPath.documentId(), '==', id)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    const doc = snapshot.docs[0];
    const current = doc.data();
    const updated = {
      ...current,
      ...req.body,
    };

    await doc.ref.set(updated, { merge: true });

    const orgRef = doc.ref.parent.parent;
    const organization = orgRef ? orgRef.id : updated.organization || 'Default Organization';

    res.json({ id: doc.id, ...updated, organization });
  } catch (err) {
    console.error('Error updating audit in Firestore', err);
    res.status(500).json({ error: 'Failed to update audit' });
  }
});

// Controls endpoints
apiRouter.get('/controls', (req, res) => {
  const { framework } = req.query || {};

  let items = controlLibrary;
  if (framework) {
    items = controlLibrary.filter(
      (c) => c.framework.toLowerCase() === String(framework).toLowerCase(),
    );
  }

  res.json({ items });
});

// Control test results per audit
// (Still in-memory for now; could also be moved to Firestore)
let controlTests = [];
let nextControlTestId = 1;

apiRouter.get('/audits/:id/control-tests', (req, res) => {
  const { id } = req.params;
  const items = controlTests.filter((t) => t.auditId === id);
  res.json({ items });
});

apiRouter.post('/audits/:id/control-tests', (req, res) => {
  const { id } = req.params;
  const { controlId, status, notes, evidenceReference } = req.body || {};

  if (!controlId) {
    return res
      .status(400)
      .json({ error: 'Missing required field: controlId' });
  }

  const auditExists = audits.some((a) => a.id === id);
  if (!auditExists) {
    return res.status(404).json({ error: 'Audit not found' });
  }

  const controlExists = controlLibrary.some((c) => c.id === controlId);
  if (!controlExists) {
    return res.status(404).json({ error: 'Control not found' });
  }

  // If a test already exists for this audit/control, update instead of creating another
  const existingIndex = controlTests.findIndex(
    (t) => t.auditId === id && t.controlId === controlId,
  );

  const base = {
    auditId: id,
    controlId,
    status: status || 'Not Tested',
    notes: notes || '',
    evidenceReference: evidenceReference || '',
    testedAt: new Date().toISOString(),
  };

  if (existingIndex !== -1) {
    const updated = {
      ...controlTests[existingIndex],
      ...base,
    };
    controlTests[existingIndex] = updated;
    return res.json(updated);
  }

  const created = {
    id: String(nextControlTestId++),
    ...base,
  };

  controlTests.push(created);
  return res.status(201).json(created);
});

// Evidence endpoints
apiRouter.get('/audits/:id/evidence', async (req, res) => {
  const { id } = req.params;
  try {
    const auditSnapshot = await db
      .collectionGroup('audits')
      .where(admin.firestore.FieldPath.documentId(), '==', id)
      .limit(1)
      .get();

    if (auditSnapshot.empty) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    const auditDoc = auditSnapshot.docs[0];
    const evidenceSnapshot = await auditDoc.ref.collection('evidence').get();
    const items = evidenceSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ items });
  } catch (err) {
    console.error('Error fetching evidence from Firestore', err);
    res.status(500).json({ error: 'Failed to fetch evidence' });
  }
});

apiRouter.post('/audits/:id/evidence', async (req, res) => {
  const { id } = req.params;
  const {
    controlId,
    type,
    title,
    description,
    link,
  } = req.body || {};

  if (!controlId) {
    return res
      .status(400)
      .json({ error: 'Missing required field: controlId' });
  }

  try {
    const auditSnapshot = await db
      .collectionGroup('audits')
      .where(admin.firestore.FieldPath.documentId(), '==', id)
      .limit(1)
      .get();

    if (auditSnapshot.empty) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    const controlExists = controlLibrary.some((c) => c.id === controlId);
    if (!controlExists) {
      return res.status(404).json({ error: 'Control not found' });
    }

    if (!title) {
      return res
        .status(400)
        .json({ error: 'Missing required field: title' });
    }

    const auditDoc = auditSnapshot.docs[0];

    const data = {
      auditId: id,
      controlId,
      type: type || 'Other',
      title,
      description: description || '',
      link: link || '',
      uploadedAt: new Date().toISOString(),
    };

    const docRef = await auditDoc.ref.collection('evidence').add(data);

    res.status(201).json({
      id: docRef.id,
      ...data,
    });
  } catch (err) {
    console.error('Error creating evidence in Firestore', err);
    res.status(500).json({ error: 'Failed to create evidence' });
  }
});

app.use('/api', apiRouter);

// Fallback for non-existing routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

const port = config.port;

app.listen(port, () => {
  console.log(`Smart IT Audit backend listening on port ${port}`);
});

module.exports = app;

