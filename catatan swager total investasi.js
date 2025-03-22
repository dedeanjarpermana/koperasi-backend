
/**
 * @swagger
 * /api/total-investasi:
 *   get:
 *     summary: Get total investasi peruser
 *     description: Retrieve list total investasi peruser
 *     responses:
 *       200:
 *         description: Successful response with the list of members.
 *         content:
 *           application/json:
 *             schema:
 *               type: array  
 *               items:
 *                 type: object
 *                 properties:
 *                   id_anggota:
 *                     type: varchar
 *                     description: Unique identifier for the member.
 *                     example: ANG-01-01
 *                  nama_lengkap:
 *                     type: string
 *                     description: nama lengkap dari user yang sudah login.
 *                     example: dede anjar
 *                   total_investasi:
 *                     type: number
 *                     format: float
 *                     description: Total investments made by the member.
 *                     example: 3000000.75
 *       500:
 *         description: Database query failed or server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *                   example: "Database query failed: Connection error."
 */