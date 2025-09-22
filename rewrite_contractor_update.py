from pathlib import Path

old_block = """  app.put(\"/api/contractors/:id\", isAuthenticated, requireOwnershipOrAdmin(), async (req: any, res) => {\n    try {\n      const { contractorStorage } = await getDirectoryRepositories();\n      const validatedData = ContractorProfileUpdateSchema.parse(req.body);\n      const profile = await contractorStorage.updateContractorProfile(req.params.id, validatedData);\n      if (!profile) {\n        return res.status(404).json({ error: \"Contractor profile not found\" });\n      }\n      res.json(profile);\n    } catch (error: any) {\n      console.error(\"Contractor update error:\", error);\n      if (error.name === 'ZodError') {\n        return res.status(400).json({ error: \"Invalid contractor profile data\", details: error.errors });\n      }\n      res.status(500).json({ error: \"Internal server error\" });\n    }\n  });\n"""

new_block = """  app.put(\"/api/contractors/:id\", isAuthenticated, requireOwnershipOrAdmin(), async (req: any, res) => {\n    try {\n      const { contractorStorage } = await getDirectoryRepositories();\n      const validatedData = ContractorProfileUpdateSchema.parse(req.body);\n      const {\n        licenseExpiryDate,\n        insuranceExpiryDate,\n        hourlyRate,\n        bondingAmount,\n        ...rest\n      } = validatedData;\n\n      const updatePayload: Partial<InsertContractorProfile> = { **rest };\n\n"""

path = Path(r'server/routes.ts')
text = path.read_text(encoding='utf-8')
if old_block not in text:
    raise SystemExit('contractor update block not found')
text = text.replace(old_block, new_block, 1)
path.write_text(text, encoding='utf-8')
