<?php

$finder = PhpCsFixer\Finder::create()
    ->in(__DIR__ . '/api')
    ->exclude('vendor');

return (new PhpCsFixer\Config())
    ->setRiskyAllowed(false)
    ->setRules([
        '@PER-CS2.0' => true,
        'array_syntax' => ['syntax' => 'short'],
    ])
    ->setFinder($finder);
