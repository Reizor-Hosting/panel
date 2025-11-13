<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Controllers\Admin;

Route::group(['prefix' => 'extensions/serversplitter'], function () {
	Route::get('/', [Admin\Extensions\serversplitter\serversplitterExtensionController::class, 'index'])->name('admin.extensions.serversplitter.index');
	Route::patch('/', [Admin\Extensions\serversplitter\serversplitterExtensionController::class, 'update'])->name('admin.extensions.serversplitter.patch');
	Route::post('/', [Admin\Extensions\serversplitter\serversplitterExtensionController::class, 'post'])->name('admin.extensions.serversplitter.post');
	Route::put('/', [Admin\Extensions\serversplitter\serversplitterExtensionController::class, 'put'])->name('admin.extensions.serversplitter.put');
	Route::delete('/{target}/{id}', [Admin\Extensions\serversplitter\serversplitterExtensionController::class, 'delete'])->name('admin.extensions.serversplitter.delete');
});