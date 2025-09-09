// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title CarbonCreditNFT
 * @dev ERC721 token representing Blue Carbon Credits with additional metadata
 */
contract CarbonCreditNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    // Token counter for unique IDs
    Counters.Counter private _tokenIds;
    
    // Struct to store carbon credit metadata
    struct CarbonCredit {
        uint256 creditsAmount;      // Number of carbon credits
        string plantType;           // Type of plant (Mangrove, Seagrass, etc.)
        string location;            // Geographic location
        uint256 areaRestored;       // Area restored in square meters
        uint256 plantsCount;        // Number of plants
        uint256 plantingDate;       // Timestamp of planting
        address ngoAddress;         // NGO that performed the restoration
        string uploadId;            // Reference to off-chain upload data
        bool isVerified;            // Verification status
        uint256 mintTimestamp;      // When the NFT was minted
    }
    
    // Mapping from token ID to carbon credit metadata
    mapping(uint256 => CarbonCredit) public carbonCredits;
    
    // Mapping to track total credits owned by address
    mapping(address => uint256) public totalCreditsOwned;
    
    // Mapping to prevent double minting from same upload
    mapping(string => bool) public uploadIdUsed;
    
    // Authorized minters (admin addresses)
    mapping(address => bool) public authorizedMinters;
    
    // Events
    event CarbonCreditMinted(
        uint256 indexed tokenId,
        address indexed ngoAddress,
        uint256 creditsAmount,
        string plantType,
        string location
    );
    
    event CarbonCreditVerified(uint256 indexed tokenId, bool verified);
    event MinterAuthorized(address indexed minter, bool authorized);
    
    modifier onlyAuthorizedMinter() {
        require(authorizedMinters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
        _;
    }
    
    constructor() ERC721("Blue Carbon Credit", "BCC") {
        // Authorize contract owner as initial minter
        authorizedMinters[msg.sender] = true;
    }
    
    /**
     * @dev Mint a new carbon credit NFT
     * @param ngoAddress The address of the NGO
     * @param creditsAmount Number of carbon credits
     * @param plantType Type of plant restored
     * @param location Geographic location
     * @param areaRestored Area restored in square meters
     * @param plantsCount Number of plants
     * @param plantingDate Timestamp of planting
     * @param uploadId Reference to off-chain data
     * @param tokenURI Metadata URI for the token
     */
    function mintCarbonCredit(
        address ngoAddress,
        uint256 creditsAmount,
        string memory plantType,
        string memory location,
        uint256 areaRestored,
        uint256 plantsCount,
        uint256 plantingDate,
        string memory uploadId,
        string memory tokenURI
    ) public onlyAuthorizedMinter nonReentrant returns (uint256) {
        require(ngoAddress != address(0), "Invalid NGO address");
        require(creditsAmount > 0, "Credits amount must be positive");
        require(bytes(uploadId).length > 0, "Upload ID required");
        require(!uploadIdUsed[uploadId], "Upload ID already used");
        
        // Mark upload ID as used
        uploadIdUsed[uploadId] = true;
        
        // Increment token counter
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        // Mint the NFT to the NGO
        _mint(ngoAddress, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        // Store carbon credit metadata
        carbonCredits[newTokenId] = CarbonCredit({
            creditsAmount: creditsAmount,
            plantType: plantType,
            location: location,
            areaRestored: areaRestored,
            plantsCount: plantsCount,
            plantingDate: plantingDate,
            ngoAddress: ngoAddress,
            uploadId: uploadId,
            isVerified: false, // Initially unverified
            mintTimestamp: block.timestamp
        });
        
        // Update total credits owned
        totalCreditsOwned[ngoAddress] += creditsAmount;
        
        emit CarbonCreditMinted(newTokenId, ngoAddress, creditsAmount, plantType, location);
        
        return newTokenId;
    }
    
    /**
     * @dev Verify a carbon credit NFT
     * @param tokenId The token ID to verify
     */
    function verifyCarbonCredit(uint256 tokenId) public onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        
        carbonCredits[tokenId].isVerified = true;
        emit CarbonCreditVerified(tokenId, true);
    }
    
    /**
     * @dev Authorize/deauthorize an address to mint tokens
     * @param minter The address to authorize/deauthorize
     * @param authorized Whether to authorize or deauthorize
     */
    function setAuthorizedMinter(address minter, bool authorized) public onlyOwner {
        require(minter != address(0), "Invalid minter address");
        authorizedMinters[minter] = authorized;
        emit MinterAuthorized(minter, authorized);
    }
    
    /**
     * @dev Get carbon credit metadata for a token
     * @param tokenId The token ID
     */
    function getCarbonCredit(uint256 tokenId) public view returns (CarbonCredit memory) {
        require(_exists(tokenId), "Token does not exist");
        return carbonCredits[tokenId];
    }
    
    /**
     * @dev Get total number of tokens minted
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }
    
    /**
     * @dev Get tokens owned by an address
     * @param owner The owner address
     */
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= _tokenIds.current(); i++) {
            if (ownerOf(i) == owner) {
                tokenIds[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return tokenIds;
    }
    
    /**
     * @dev Calculate total carbon credits for an address
     * @param owner The owner address
     */
    function calculateTotalCredits(address owner) public view returns (uint256) {
        uint256[] memory tokenIds = tokensOfOwner(owner);
        uint256 total = 0;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            total += carbonCredits[tokenIds[i]].creditsAmount;
        }
        
        return total;
    }
    
    /**
     * @dev Override transfer to update credits tracking
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId);
        
        if (from != address(0) && to != address(0)) {
            // Update credits tracking on transfer
            uint256 creditsAmount = carbonCredits[tokenId].creditsAmount;
            totalCreditsOwned[from] -= creditsAmount;
            totalCreditsOwned[to] += creditsAmount;
        }
    }
    
    /**
     * @dev Emergency pause functionality
     */
    function pause() public onlyOwner {
        // Implementation for pausing contract if needed
        // This would require importing Pausable from OpenZeppelin
    }
    
    // Required overrides for ERC721URIStorage
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
