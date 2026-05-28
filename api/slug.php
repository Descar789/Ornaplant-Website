<?php
declare(strict_types=1);

const SLUG_MAX_LENGTH = 180;
const SLUG_BASE_LENGTH = 140;

function slugify(string $s): string {
    $s = mb_strtolower(trim($s), 'UTF-8');

    $s = strtr($s, [
        'ñ' => 'n', 'Ñ' => 'n',
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u',
        'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u',
    ]);

    $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
    if ($ascii !== false && $ascii !== '') {
        $s = $ascii;
    }

    $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';
    $s = trim($s, '-');
    return $s !== '' ? $s : 'planta';
}

function bounded_slug(string $base, string $suffix = ''): string {
    $suffix = trim($suffix, '-');
    $maxBase = SLUG_MAX_LENGTH;

    if ($suffix !== '') {
        $maxBase = max(1, SLUG_MAX_LENGTH - mb_strlen($suffix, 'UTF-8') - 1);
    }

    $base = trim(mb_substr($base, 0, min(SLUG_BASE_LENGTH, $maxBase), 'UTF-8'), '-');
    if ($base === '') {
        $base = 'planta';
    }

    return $suffix !== '' ? $base . '-' . $suffix : $base;
}

function unique_slug(PDO $pdo, string $nombre, string $id, ?string $excludeId = null): string {
    $base = mb_substr(slugify($nombre), 0, SLUG_BASE_LENGTH, 'UTF-8');
    $idSuffix = strtolower(preg_replace('/[^a-z0-9]+/i', '', $id) ?? '');
    if ($idSuffix === '') {
        $idSuffix = 'id';
    }

    $candidates = [
        bounded_slug($base),
        bounded_slug($base, $idSuffix),
    ];

    $check = $pdo->prepare(
        'SELECT 1 FROM plantas WHERE slug = :slug'
        . ($excludeId !== null ? ' AND id != :exc' : '')
        . ' LIMIT 1'
    );

    foreach ($candidates as $candidate) {
        $params = [':slug' => $candidate];
        if ($excludeId !== null) {
            $params[':exc'] = $excludeId;
        }

        $check->execute($params);
        if (!$check->fetchColumn()) {
            return $candidate;
        }
    }

    $i = 2;
    while (true) {
        $candidate = bounded_slug($base, (string)$i++);
        $params = [':slug' => $candidate];
        if ($excludeId !== null) {
            $params[':exc'] = $excludeId;
        }

        $check->execute($params);
        if (!$check->fetchColumn()) {
            return $candidate;
        }
    }
}
