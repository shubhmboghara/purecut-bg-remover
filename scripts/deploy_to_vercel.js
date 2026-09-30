import fs from 'fs';
import path from 'path';

async function deploy() {
  const authPath = path.join(process.env.APPDATA, 'com.vercel.cli', 'Data', 'auth.json');
  if (!fs.existsSync(authPath)) {
    throw new Error('Vercel auth.json not found');
  }
  const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
  const token = auth.token;

  console.log('1. Checking or creating Vercel project "purecut-bg-remover"...');
  
  // 1. Create or get project
  let projectRes = await fetch('https://api.vercel.com/v9/projects', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'purecut-bg-remover',
      framework: 'vite',
      gitRepository: {
        type: 'github',
        repo: 'shubhmboghara/purecut-bg-remover'
      }
    })
  });

  let projectData = await projectRes.json();
  if (!projectRes.ok) {
    if (projectData.error?.code === 'conflict') {
      console.log('Project "purecut-bg-remover" already exists in Vercel. Fetching existing project...');
      const getRes = await fetch('https://api.vercel.com/v9/projects/purecut-bg-remover', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      projectData = await getRes.json();
    } else {
      console.error('Failed to create project:', projectData);
      throw new Error(projectData.error?.message || 'Failed to create project');
    }
  }

  console.log('✅ Project ready:', projectData.name, '(ID:', projectData.id, ')');

  // 2. Trigger deployment
  console.log('2. Triggering deployment on Vercel from GitHub main branch...');
  const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'purecut-bg-remover',
      project: projectData.id,
      gitSource: {
        type: 'github',
        ref: 'main',
        repoId: 1397400322
      }
    })
  });

  const deployData = await deployRes.json();
  if (!deployRes.ok) {
    console.error('Deployment error:', deployData);
    throw new Error(deployData.error?.message || 'Deployment failed');
  }

  console.log('🎉 Deployment triggered successfully!');
  console.log('Deployment ID:', deployData.id);
  console.log('Deployment URL: https://' + deployData.url);
  console.log('Inspector URL:', deployData.inspectorUrl);

  // 3. Poll for deployment status
  console.log('3. Waiting for build and deployment to complete...');
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 4000));
    const checkRes = await fetch(`https://api.vercel.com/v13/deployments/${deployData.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const checkData = await checkRes.json();
    console.log(`[${(i + 1) * 4}s] Status: ${checkData.readyState}`);
    if (checkData.readyState === 'READY') {
      console.log('🚀 DEPLOYMENT COMPLETED! Production site is LIVE at:');
      console.log('https://' + checkData.url);
      if (checkData.alias && checkData.alias.length > 0) {
        console.log('Production Domains:', checkData.alias.map(a => `https://${a}`).join(', '));
      }
      return checkData;
    } else if (checkData.readyState === 'ERROR' || checkData.readyState === 'CANCELED') {
      console.error('Deployment failed with state:', checkData.readyState);
      console.error(checkData.error);
      throw new Error('Deployment ended in state: ' + checkData.readyState);
    }
  }

  console.log('Still building in background. Live preview URL: https://' + deployData.url);
  return deployData;
}

deploy().catch(err => {
  console.error('Fatal deployment script error:', err);
  process.exit(1);
});
