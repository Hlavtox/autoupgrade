<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class HealthCheckController extends AbstractController
{
    #[Route('/healthcheck')]
    public function index(): Response
    {
        return new JsonResponse([
            'status' => 'ok',
            'version' => $this->getParameter('app.version'),
        ]);
    }
}
