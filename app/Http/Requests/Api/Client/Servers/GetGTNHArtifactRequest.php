<?php

namespace Pterodactyl\Http\Requests\Api\Client\Servers;

use Illuminate\Foundation\Http\FormRequest;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class GetGTNHArtifactRequest extends FormRequest
{
    /**
     * No authentication required - access is controlled via signed URLs
     */
    public function authorize(): bool
    {
        // Log signature validation attempt
        \Log::info('GTNH Artifact Proxy: Validating signature', [
            'url' => $this->fullUrl(),
            'has_signature' => $this->has('signature'),
            'has_expires' => $this->has('expires'),
            'signature' => $this->input('signature'),
        ]);
        
        // Verify the signature if present
        if ($this->hasValidSignature()) {
            \Log::info('GTNH Artifact Proxy: Signature valid');
            return true;
        }

        // If no signature or invalid signature, throw 403
        \Log::warning('GTNH Artifact Proxy: Signature validation failed');
        throw new AccessDeniedHttpException('Invalid or expired signature.');
    }

    public function rules(): array
    {
        return [
            'url' => 'required|string|url',
        ];
    }
}

