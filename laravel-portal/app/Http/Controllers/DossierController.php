<?php

namespace App\Http\Controllers;

/**
 * DossierController
 * 
 * Alias controller extending InvestigationController for architectural compatibility
 * across both VEDIKA Dossier and Investigation route namespaces.
 */
class DossierController extends InvestigationController
{
    // Inherits all methods from InvestigationController
}
