<!DOCTYPE html>
<html>

<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap" rel="stylesheet">

    <style type="text/css" rel="stylesheet" media="all">
        /* Prevent email clients from overriding styles */
        :root {
            color-scheme: light only;
            supported-color-schemes: light;
        }
        
        body {
            background-color: #f5f5f5 !important;
            color: #2F3133 !important;
        }
        
        /* Force text colors to remain dark */
        * {
            color: #2F3133 !important;
        }
        
        h1, h2, h3, h4, h5, h6 {
            color: #2F3133 !important;
        }
        
        p, span, td, div {
            color: #2F3133 !important;
        }
        
        a {
            color: #d32f42 !important;
        }
        
        .button {
            color: #ffffff !important;
            background-color: #d32f42 !important;
        }
        
        /* Media Queries */
        @media only screen and (max-width: 500px) {
            .button {
                width: 100% !important;
            }
        }
        
        /* Prevent Outlook dark mode from inverting colors */
        [data-ogsc] body,
        [data-ogsc] .email-wrapper,
        [data-ogsc] .email-body,
        [data-ogsc] .email-masthead {
            background-color: #ffffff !important;
        }
        
        [data-ogsc] h1,
        [data-ogsc] h2,
        [data-ogsc] h3,
        [data-ogsc] p,
        [data-ogsc] span,
        [data-ogsc] td,
        [data-ogsc] div {
            color: #2F3133 !important;
        }
        
        [data-ogsc] a {
            color: #d32f42 !important;
        }
        
        [data-ogsc] .button {
            color: #ffffff !important;
            background-color: #d32f42 !important;
        }
        
        /* Force Outlook to respect backgrounds */
        .email-body-wrapper {
            background-color: #ffffff !important;
        }
        
        .email-masthead-wrapper {
            background-color: #ffffff !important;
        }
        
        /* iOS Mail dark mode fixes */
        @media (prefers-color-scheme: dark) {
            body, .email-body, .email-masthead {
                background-color: #ffffff !important;
            }
            h1, h2, h3, h4, h5, h6, p, span, td, div {
                color: #2F3133 !important;
            }
            a {
                color: #d32f42 !important;
            }
            .button {
                color: #ffffff !important;
                background-color: #d32f42 !important;
            }
        }
    </style>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {
            font-family: Arial, Helvetica, sans-serif !important;
        }
        body {
            background-color: #f5f5f5 !important;
        }
        .email-masthead {
            background-color: #ffffff !important;
        }
        .email-body {
            background-color: #ffffff !important;
        }
        h1, h2, h3, h4, h5, h6, p, span, td, div {
            color: #2F3133 !important;
        }
        a {
            color: #d32f42 !important;
        }
        .masthead-name {
            color: #d32f42 !important;
        }
        .button {
            color: #ffffff !important;
            background-color: #d32f42 !important;
        }
    </style>
    <![endif]-->
</head>

<?php

$style = [
    /* Layout ------------------------------ */

    'body' => 'margin: 0; padding: 0; width: 100%; background-color: #f5f5f5;',
    'email-wrapper' => 'width: 100%; margin: 0; padding: 0; background-color: #f5f5f5;',

    /* Masthead ----------------------- */

    'email-masthead' => 'padding: 30px 0; text-align: center; background-color: #ffffff; border-bottom: 3px solid #d32f42;',
    'email-masthead_name' => 'font-size: 24px; font-weight: 600; color: #d32f42; text-decoration: none; letter-spacing: 0.5px;',

    'email-body' => 'width: 100%; margin: 0; padding: 0; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; background-color: #ffffff;',
    'email-body_inner' => 'width: auto; max-width: 570px; margin: 0 auto; padding: 0;',
    'email-body_cell' => 'padding: 40px;',

    'email-footer' => 'width: auto; max-width: 570px; margin: 0 auto; padding: 0; text-align: center;',
    'email-footer_cell' => 'color: #999999; padding: 35px; text-align: center;',

    /* Body ------------------------------ */

    'body_action' => 'width: 100%; margin: 30px auto; padding: 0; text-align: center;',
    'body_sub' => 'margin-top: 25px; padding-top: 25px; border-top: 1px solid #e0e0e0;',

    /* Type ------------------------------ */

    'anchor' => 'color: #d32f42; text-decoration: none; font-weight: 500;',
    'header-1' => 'margin-top: 0; color: #2F3133; font-size: 22px; font-weight: 600; text-align: left;',
    'paragraph' => 'margin-top: 0; color: #2F3133; font-size: 16px; line-height: 1.6em;',
    'paragraph-sub' => 'margin-top: 0; color: #74787E; font-size: 13px; line-height: 1.5em;',
    'paragraph-center' => 'text-align: center;',

    /* Buttons ------------------------------ */

    'button' => 'display: block; display: inline-block; min-width: 200px; min-height: 20px; padding: 14px 40px;
                 background-color: #d32f42; border-radius: 4px; color: #ffffff; font-size: 16px; line-height: 25px;
                 text-align: center; text-decoration: none; font-weight: 600; -webkit-text-size-adjust: none;
                 box-shadow: 0 4px 12px rgba(211, 47, 66, 0.25);',

    'button--green' => 'background-color: #22BC66; box-shadow: 0 4px 12px rgba(34, 188, 102, 0.25);',
    'button--red' => 'background-color: #d32f42; box-shadow: 0 4px 12px rgba(211, 47, 66, 0.25);',
    'button--blue' => 'background-color: #d32f42; box-shadow: 0 4px 12px rgba(211, 47, 66, 0.25);',
];
?>

<?php $fontFamily = 'font-family: \'Oswald\', Arial, \'Helvetica Neue\', Helvetica, sans-serif;'; ?>

<body style="{{ $style['body'] }}">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f5f5f5;">
        <tr>
            <td style="{{ $style['email-wrapper'] }}" align="center" bgcolor="#f5f5f5">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <!-- Logo -->
                    <tr>
                        <td style="{{ $style['email-masthead'] }}" bgcolor="#ffffff" class="email-masthead-wrapper">
                            <a style="{{ $fontFamily }} {{ $style['email-masthead_name'] }}" href="{{ url('/') }}" target="_blank" class="masthead-name">
                                {{ config('app.name') }}
                            </a>
                        </td>
                    </tr>

                    <!-- Email Body -->
                    <tr>
                        <td style="{{ $style['email-body'] }}" width="100%" bgcolor="#ffffff" class="email-body-wrapper">
                            <table style="{{ $style['email-body_inner'] }}" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td style="{{ $fontFamily }} {{ $style['email-body_cell'] }}" bgcolor="#ffffff">
                                        <!-- Greeting -->
                                        <h1 style="{{ $style['header-1'] }}" color="#2F3133">
                                            @if (! empty($greeting))
                                                {{ $greeting }}
                                            @else
                                                @if ($level == 'error')
                                                    Whoops!
                                                @else
                                                    Hello!
                                                @endif
                                            @endif
                                        </h1>

                                        <!-- Intro -->
                                        @foreach ($introLines as $line)
                                            <p style="{{ $style['paragraph'] }}" color="#2F3133">
                                                {{ $line }}
                                            </p>
                                        @endforeach

                                        <!-- Action Button -->
                                        @if (isset($actionText))
                                            <table style="{{ $style['body_action'] }}" align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation">
                                                <tr>
                                                    <td align="center" bgcolor="#ffffff">
                                                        <?php
                                                            switch ($level) {
                                                                case 'success':
                                                                    $actionColor = 'button--green';
                                                                    break;
                                                                case 'error':
                                                                    $actionColor = 'button--red';
                                                                    break;
                                                                default:
                                                                    $actionColor = 'button--blue';
                                                            }
                                                        ?>

                                                        <!--[if mso]>
                                                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{ $actionUrl }}" style="height:50px;v-text-anchor:middle;width:200px;" arcsize="8%" strokecolor="#d32f42" fillcolor="#d32f42">
                                                            <w:anchorlock/>
                                                            <center style="color:#ffffff;font-family:Arial, sans-serif;font-size:16px;font-weight:600;">{{ $actionText }}</center>
                                                        </v:roundrect>
                                                        <![endif]-->
                                                        <!--[if !mso]><!-->
                                                        <a href="{{ $actionUrl }}"
                                                            style="{{ $fontFamily }} {{ $style['button'] }} {{ $style[$actionColor] }}"
                                                            class="button"
                                                            target="_blank">
                                                            {{ $actionText }}
                                                        </a>
                                                        <!--<![endif]-->
                                                    </td>
                                                </tr>
                                            </table>
                                        @endif

                                        <!-- Outro -->
                                        @foreach ($outroLines as $line)
                                            <p style="{{ $style['paragraph'] }}" color="#2F3133">
                                                {{ $line }}
                                            </p>
                                        @endforeach

                                        <!-- Salutation -->
                                        <p style="{{ $style['paragraph'] }}" color="#2F3133">
                                            Regards,<br>Reizor Hosting & Pterodactyl
                                        </p>

                                        <!-- Sub Copy -->
                                        @if (isset($actionText))
                                            <table style="{{ $style['body_sub'] }}" role="presentation">
                                                <tr>
                                                    <td style="{{ $fontFamily }}" bgcolor="#ffffff">
                                                        <p style="{{ $style['paragraph-sub'] }}" color="#74787E">
                                                            If you're having trouble clicking the "{{ $actionText }}" button,
                                                            copy and paste the URL below into your web browser:
                                                        </p>

                                                        <p style="{{ $style['paragraph-sub'] }}" color="#74787E">
                                                            <a style="{{ $style['anchor'] }}" href="{{ $actionUrl }}" target="_blank" color="#d32f42">
                                                                {{ $actionUrl }}
                                                            </a>
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        @endif
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td bgcolor="#f5f5f5">
                            <table style="{{ $style['email-footer'] }}" align="center" width="570" cellpadding="0" cellspacing="0" role="presentation">
                                <tr>
                                    <td style="{{ $fontFamily }} {{ $style['email-footer_cell'] }}" bgcolor="#f5f5f5">
                                        <p style="{{ $style['paragraph-sub'] }}" color="#999999">
                                            &copy; {{ date('Y') }}
                                            <a style="{{ $style['anchor'] }}" href="{{ url('/') }}" target="_blank" color="#d32f42">Reizor Hosting & Pterodactyl</a>.
                                            All rights reserved.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
