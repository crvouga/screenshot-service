import express, { Router } from 'express';
import path from 'path';

const clientBuildPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'dist',
  'apps',
  'client'
);

export const useStaticFiles = (router: Router) => {
  router.use(express.static(clientBuildPath));

  router.get('*', (_req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
};
