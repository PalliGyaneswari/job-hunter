/**
 * Demo Data Seeder
 * Seeds the database with realistic sample jobs so the dashboard
 * looks populated without requiring API keys.
 *
 * Run: node src/db/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db     = require('../config/db');
const fs     = require('fs');
const path   = require('path');

const SEED_JOBS = [
  {
    job_id: 'seed-001', title: 'AI Engineer – Generative AI Platform', company: 'Microsoft',
    location: 'Hyderabad', role_category: 'AI Engineer', source: 'seed',
    url: 'https://careers.microsoft.com/', posted_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    description_snippet: 'Join the Azure AI team to build next-generation generative AI capabilities. Work with LLMs, fine-tuning pipelines, and responsible AI frameworks. Ideal for fresher/new grad with Python and ML fundamentals.',
    is_priority: 1, is_verified: 1, is_stale: 0, is_active: 1,
  },
  {
    job_id: 'seed-002', title: 'Machine Learning Engineer I', company: 'Amazon',
    location: 'Bangalore', role_category: 'ML Engineer', source: 'seed',
    url: 'https://www.amazon.jobs/', posted_date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    description_snippet: 'SDE/MLE role at Amazon working on product recommendation engines. Skills required: Python, scikit-learn, XGBoost, SQL. 0-1 years experience eligible.',
    is_priority: 1, is_verified: 1, is_stale: 0, is_active: 1,
  },
  {
    job_id: 'seed-003', title: 'Full Stack Developer – React & Node.js', company: 'Freshworks',
    location: 'Chennai', role_category: 'Full Stack Developer', source: 'seed',
    url: 'https://www.freshworks.com/company/careers/', posted_date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    description_snippet: 'Build customer experience products using React, Node.js, and MySQL. Freshers welcome. Experience with REST APIs, JWT auth, and Tailwind CSS is a plus.',
    is_priority: 1, is_verified: 1, is_stale: 0, is_active: 1,
  },
  {
    job_id: 'seed-004', title: 'Software Engineer – MERN Stack', company: 'Razorpay',
    location: 'Bangalore', role_category: 'Full Stack Developer', source: 'seed',
    url: 'https://razorpay.com/jobs/', posted_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    description_snippet: 'Work on Razorpay\'s payments infrastructure using the MERN stack. We\'re looking for sharp engineers with React, Node.js, MongoDB/MySQL experience. Entry-level role.',
    is_priority: 1, is_verified: 1, is_stale: 0, is_active: 1,
  },
  {
    job_id: 'seed-005', title: 'ML Intern – Computer Vision', company: 'Google',
    location: 'Hyderabad', role_category: 'ML Engineer', source: 'seed',
    url: 'https://careers.google.com/', posted_date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    description_snippet: 'Google AI internship focused on computer vision and deep learning. You\'ll work with TensorFlow, PyTorch, and real production datasets. Grad students and final-year UG eligible.',
    is_priority: 1, is_verified: 1, is_stale: 0, is_active: 1,
  },
  {
    job_id: 'seed-006', title: 'Software Engineer Trainee', company: 'TCS',
    location: 'Pune', role_category: 'Software Engineer Intern', source: 'seed',
    url: 'https://www.tcs.com/careers', posted_date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    description_snippet: 'TCS NQT hiring for 2025/2026 graduates. Trainee roles across Java, Python, Full Stack. Training provided. Apply to join one of India\'s largest tech companies.',
    is_priority: 1, is_verified: 1, is_stale: 0, is_active: 1,
  },
  {
    job_id: 'seed-007', title: 'AI/ML Engineer – Remote', company: 'Turing',
    location: 'Remote', role_category: 'AI Engineer', source: 'remoteok',
    url: 'https://remoteok.com/', posted_date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
    description_snippet: 'Remote AI/ML engineering role. Work with top US companies on AI projects. Python, TensorFlow, PyTorch required. Competitive pay in USD.',
    is_priority: 0, is_verified: 0, is_stale: 0, is_active: 1,
  },
  {
    job_id: 'seed-008', title: 'Full Stack Developer (Fresher)', company: 'Infosys',
    location: 'Bangalore', role_category: 'Full Stack Developer', source: 'seed',
    url: 'https://www.infosys.com/careers/', posted_date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    description_snippet: 'Infosys InfyTQ / InStep hiring for 2025 graduates. Full Stack roles involving React, Node.js, and cloud platforms. Open to CS/IT graduates with CGPA > 6.5.',
    is_priority: 1, is_verified: 1, is_stale: 0, is_active: 1,
  },
  {
    job_id: 'seed-009', title: 'Junior Machine Learning Engineer', company: 'Analytics Vidhya',
    location: 'Hyderabad', role_category: 'ML Engineer', source: 'adzuna',
    url: 'https://www.analyticsvidhya.com/jobs/', posted_date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
    description_snippet: 'Entry-level ML engineer role at Analytics Vidhya. You\'ll work on classification models, data pipelines, and MLOps. Skills: Python, sklearn, XGBoost, Random Forest, SQL.',
    is_priority: 0, is_verified: 0, is_stale: 0, is_active: 1,
  },
  {
    job_id: 'seed-010', title: 'React Developer – Fresher', company: 'Zoho',
    location: 'Chennai', role_category: 'Full Stack Developer', source: 'jooble',
    url: 'https://www.zoho.com/careers/', posted_date: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0],
    description_snippet: 'Zoho is hiring React developers for their SaaS product suite. Freshers welcome. Skills: React, JavaScript, REST APIs, CSS. Chennai office preferred but remote possible.',
    is_priority: 0, is_verified: 0, is_stale: 0, is_active: 1,
  },
  {
    job_id: 'seed-011', title: 'NLP Research Engineer (Entry Level)', company: 'Sarvam AI',
    location: 'Bangalore', role_category: 'AI Engineer', source: 'arbeitnow',
    url: 'https://www.sarvam.ai/careers', posted_date: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0],
    description_snippet: 'Sarvam AI is building Indian language AI. We need NLP engineers passionate about multilingual models. PyTorch, Hugging Face transformers, Python experience required.',
    is_priority: 0, is_verified: 0, is_stale: 0, is_active: 1,
  },
  {
    job_id: 'seed-012', title: 'Backend Developer – Node.js & Express', company: 'Wipro',
    location: 'Pune', role_category: 'Software Engineer', source: 'seed',
    url: 'https://careers.wipro.com/', posted_date: new Date(Date.now() - 9 * 86400000).toISOString().split('T')[0],
    description_snippet: 'Wipro WILP / Campus hiring for backend roles. Node.js, Express, MySQL, REST APIs. 2025/2026 graduates eligible. Locations: Pune, Bangalore, Hyderabad.',
    is_priority: 1, is_verified: 1, is_stale: 0, is_active: 1,
  },
  {
    job_id: 'seed-013', title: 'Data Science Intern', company: 'Flipkart',
    location: 'Bangalore', role_category: 'ML Engineer', source: 'jsearch',
    url: 'https://www.flipkartcareers.com/', posted_date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
    description_snippet: 'Flipkart summer internship in Data Science. Work on recommendation systems and fraud detection. Python, SQL, scikit-learn required. 6 months duration.',
    is_priority: 0, is_verified: 1, is_stale: 0, is_active: 1,
  },
  {
    job_id: 'seed-014', title: 'Full Stack Engineer (Remote, UAE)', company: 'Careem',
    location: 'Dubai, UAE', role_category: 'Full Stack Developer', source: 'arbeitnow',
    url: 'https://www.careem.com/en-ae/careers/', posted_date: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0],
    description_snippet: 'Careem (Uber subsidiary) hiring Full Stack engineers for the UAE market. React, Node.js, microservices. Remote-first team. Open to candidates in India/UAE.',
    is_priority: 0, is_verified: 0, is_stale: 0, is_active: 1,
  },
  {
    job_id: 'seed-015', title: 'ML Platform Engineer – Closed', company: 'Swiggy',
    location: 'Bangalore', role_category: 'ML Engineer', source: 'jooble',
    url: 'https://bytes.swiggy.com/careers', posted_date: new Date(Date.now() - 45 * 86400000).toISOString().split('T')[0],
    description_snippet: 'This position has been filled. ML platform engineering role at Swiggy.',
    is_priority: 0, is_verified: 0, is_stale: 1, is_active: 0,
  },
];

async function seed() {
  console.log('[Seed] Running database seeder...\n');

  try {
    // Generate default admin password hash if ADMIN_PASSWORD_HASH not set
    const existingHash = process.env.ADMIN_PASSWORD_HASH;
    if (!existingHash || existingHash.includes('PLACEHOLDER')) {
      const defaultPassword = 'JobPulse2024!';
      const hash = await bcrypt.hash(defaultPassword, 12);
      console.log('[Seed] ⚠️  ADMIN_PASSWORD_HASH not set. Default credentials:');
      console.log(`       Username: ${process.env.ADMIN_USERNAME || 'admin'}`);
      console.log(`       Password: ${defaultPassword}`);
      console.log(`       Hash (copy to .env): ${hash}\n`);
    }

    let inserted = 0;
    for (const job of SEED_JOBS) {
      try {
        const [result] = await db.execute(
          `INSERT IGNORE INTO jobs
            (job_id, title, company, location, role_category, source, url,
             posted_date, description_snippet, is_active, is_priority, is_verified, is_stale)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            job.job_id, job.title, job.company, job.location, job.role_category,
            job.source, job.url, job.posted_date, job.description_snippet,
            job.is_active, job.is_priority, job.is_verified, job.is_stale,
          ]
        );
        if (result.affectedRows > 0) inserted++;
      } catch (err) {
        console.error(`[Seed] Failed to insert "${job.title}":`, err.message);
      }
    }

    console.log(`[Seed] ✓ Seeded ${inserted}/${SEED_JOBS.length} jobs`);
    console.log('[Seed] ✓ Done! Start the server with: npm run dev');
  } catch (err) {
    console.error('[Seed] Fatal error:', err.message);
    process.exit(1);
  } finally {
    await db.end().catch(() => {});
    process.exit(0);
  }
}

seed();
