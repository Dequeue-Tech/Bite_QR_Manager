"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const qrController_1 = require("../controllers/qrController");
const router = (0, express_1.Router)();
router.get('/:code', qrController_1.handleQrRedirect);
exports.default = router;
